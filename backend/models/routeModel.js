const { pool } = require('../config/db');
const { ensureDeliveryRecord } = require('./deliveryModel');

// Geocoding Fallback Dictionary for Tamil Nadu / South India Districts & Cities
const DISTRICT_COORDINATES = {
  'erode': { lat: 11.3410, lng: 77.7172 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'salem': { lat: 11.6643, lng: 78.1460 },
  'tirupur': { lat: 11.1085, lng: 77.3411 },
  'tiruppur': { lat: 11.1085, lng: 77.3411 },
  'karur': { lat: 10.9601, lng: 78.0766 },
  'namakkal': { lat: 11.2189, lng: 78.1674 },
  'dindigul': { lat: 10.3673, lng: 77.9803 },
  'madurai': { lat: 9.9252, lng: 78.1198 },
  'trichy': { lat: 10.7905, lng: 78.7047 },
  'tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'thanjavur': { lat: 10.7870, lng: 79.1378 },
  'kanchipuram': { lat: 12.8342, lng: 79.7036 },
  'vellore': { lat: 12.9165, lng: 79.1325 },
  'cuddalore': { lat: 11.7480, lng: 79.7714 },
  'tirunelveli': { lat: 8.7139, lng: 77.7567 },
  'thoothukudi': { lat: 8.7642, lng: 78.1348 },
  'tuticorin': { lat: 8.7642, lng: 78.1348 },
  'virudhunagar': { lat: 9.5680, lng: 77.9624 },
  'theni': { lat: 10.0104, lng: 77.4768 },
  'nilgiris': { lat: 11.4916, lng: 76.7337 },
  'ooty': { lat: 11.4102, lng: 76.6950 },
  'krishnagiri': { lat: 12.5186, lng: 78.2137 },
  'dharmapuri': { lat: 12.1211, lng: 78.1582 },
  'pudukkottai': { lat: 10.3833, lng: 78.8000 },
  'nagapattinam': { lat: 10.7672, lng: 79.8449 },
  'kanyakumari': { lat: 8.0883, lng: 77.5385 },
  'nagercoil': { lat: 8.1833, lng: 77.4119 },
  'villupuram': { lat: 11.9401, lng: 79.4861 },
  'perambalur': { lat: 11.2333, lng: 78.8833 },
  'ariyalur': { lat: 11.1401, lng: 79.0786 },
  'ramanathapuram': { lat: 9.3639, lng: 78.8394 },
  'sivagangai': { lat: 9.8433, lng: 78.4809 },
  'tiruvarur': { lat: 10.7709, lng: 79.6366 },
  'ranipet': { lat: 12.9279, lng: 79.3328 },
  'tirupathur': { lat: 12.4926, lng: 78.5678 },
  'kallakurichi': { lat: 11.7384, lng: 78.9639 },
  'tenkasi': { lat: 8.9593, lng: 77.3150 },
  'chengalpattu': { lat: 12.6921, lng: 79.9770 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 }
};

// Fallback Geocoder
const geocodeAddressFallback = (address = '', district = '', state = '') => {
  const cleanStr = `${address} ${district} ${state}`.toLowerCase();
  
  for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
    if (cleanStr.includes(key)) {
      return coords;
    }
  }

  // Default coordinate center (Erode / Central TN Agri hub) if unrecognized
  return { lat: 11.3410, lng: 77.7172 };
};

/**
 * Haversine Formula for exact spherical distance on Earth in KM.
 * Applies a road topology multiplier (1.25x) to estimate practical driving distance.
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // If start and end coordinates are virtually identical (<0.5km), return 5 km min local route
  if (straightLineKm < 0.5) return 5.0;

  // Road factor multiplier (~1.25x for rural/highway roads)
  const roadKm = straightLineKm * 1.25;
  return parseFloat(roadKm.toFixed(2));
};

// Speed calculation based on vehicle type
const getSpeedByVehicleType = (vehicleType) => {
  switch (vehicleType) {
    case 'Bike': return 45;
    case 'Auto': return 35;
    case 'Van': return 40;
    case 'Truck': return 35;
    default: return 40;
  }
};

// Classify distance according to requirements
const classifyDistance = (distanceKm) => {
  if (distanceKm <= 20) return 'Short Distance';
  if (distanceKm <= 100) return 'Medium Distance';
  return 'Long Distance';
};

/**
 * Optimize Delivery Route logic
 */
const optimizeDeliveryRoute = async (deliveryId, { customPickupLat, customPickupLng, customDeliveryLat, customDeliveryLng, customSpeed } = {}) => {
  const connection = await pool.getConnection();
  try {
    // 1. Fetch delivery & order details
    const [deliveries] = await connection.query(
      `SELECT d.*, o.order_number, o.delivery_address, o.district AS delivery_district, o.state AS delivery_state, dp.vehicle_type
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.id = ? OR d.order_id = ?`,
      [deliveryId, deliveryId]
    );

    if (deliveries.length === 0) {
      throw new Error('Delivery record not found.');
    }

    const delivery = deliveries[0];

    // 2. Resolve Pickup Coordinates
    let pLat = customPickupLat ? parseFloat(customPickupLat) : parseFloat(delivery.pickup_latitude);
    let pLng = customPickupLng ? parseFloat(customPickupLng) : parseFloat(delivery.pickup_longitude);

    if (isNaN(pLat) || isNaN(pLng)) {
      const geoP = geocodeAddressFallback(delivery.pickup_address, delivery.pickup_district, delivery.pickup_state);
      pLat = geoP.lat;
      pLng = geoP.lng;
    }

    // 3. Resolve Delivery Coordinates
    let dLat = customDeliveryLat ? parseFloat(customDeliveryLat) : parseFloat(delivery.delivery_latitude);
    let dLng = customDeliveryLng ? parseFloat(customDeliveryLng) : parseFloat(delivery.delivery_longitude);

    if (isNaN(dLat) || isNaN(dLng)) {
      const geoD = geocodeAddressFallback(delivery.delivery_address, delivery.delivery_district, delivery.delivery_state);
      dLat = geoD.lat;
      dLng = geoD.lng;
    }

    // 4. Calculate Distance
    const totalDistanceKm = calculateHaversineDistance(pLat, pLng, dLat, dLng);

    // 5. Calculate Speed & Duration
    const speedKmh = customSpeed ? parseInt(customSpeed) : getSpeedByVehicleType(delivery.vehicle_type);
    const rawMinutes = Math.round((totalDistanceKm / speedKmh) * 60);
    const durationMinutes = Math.max(15, rawMinutes); // Minimum 15 mins for freight handling

    // 6. Classification & Suggested Route Text
    const classification = classifyDistance(totalDistanceKm);
    const pLocName = delivery.pickup_district || 'Origin Farm';
    const dLocName = delivery.delivery_district || 'Buyer Destination';
    const suggestedSummary = `Optimized Direct Freight Route via State Highways (${pLocName} ➔ ${dLocName}). Speed: ${speedKmh} km/h avg.`;

    // 7. Insert or Update in routes table
    const [existingRoute] = await connection.query('SELECT id FROM routes WHERE delivery_id = ?', [delivery.id]);

    if (existingRoute.length > 0) {
      await connection.query(
        `UPDATE routes SET
          pickup_latitude = ?,
          pickup_longitude = ?,
          delivery_latitude = ?,
          delivery_longitude = ?,
          total_distance_km = ?,
          estimated_duration_minutes = ?,
          average_speed_kmh = ?,
          route_classification = ?,
          suggested_route_summary = ?,
          route_status = 'Optimized',
          updated_at = NOW()
        WHERE delivery_id = ?`,
        [
          pLat, pLng, dLat, dLng,
          totalDistanceKm, durationMinutes, speedKmh,
          classification, suggestedSummary,
          delivery.id
        ]
      );
    } else {
      await connection.query(
        `INSERT INTO routes (
          delivery_id, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
          total_distance_km, estimated_duration_minutes, average_speed_kmh,
          route_classification, suggested_route_summary, route_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Optimized')`,
        [
          delivery.id, pLat, pLng, dLat, dLng,
          totalDistanceKm, durationMinutes, speedKmh,
          classification, suggestedSummary
        ]
      );
    }

    // 8. Sync deliveries table coordinates & route notes
    await connection.query(
      `UPDATE deliveries SET
        pickup_latitude = ?,
        pickup_longitude = ?,
        delivery_latitude = ?,
        delivery_longitude = ?,
        route_notes = ?
      WHERE id = ?`,
      [pLat, pLng, dLat, dLng, suggestedSummary, delivery.id]
    );

    // 9. Return complete route details
    return getRouteByDeliveryId(delivery.id);
  } finally {
    connection.release();
  }
};

/**
 * Get Route by Delivery ID or Order ID
 */
const getRouteByDeliveryId = async (deliveryOrOrderId) => {
  const connection = await pool.getConnection();
  try {
    // First ensure delivery record exists
    let [deliveries] = await connection.query(
      `SELECT d.* FROM deliveries d WHERE d.id = ? OR d.order_id = ?`,
      [deliveryOrOrderId, deliveryOrOrderId]
    );

    if (deliveries.length === 0) {
      await ensureDeliveryRecord(deliveryOrOrderId);
      [deliveries] = await connection.query(
        `SELECT d.* FROM deliveries d WHERE d.id = ? OR d.order_id = ?`,
        [deliveryOrOrderId, deliveryOrOrderId]
      );
    }

    if (deliveries.length === 0) return null;
    const delivery = deliveries[0];

    // Fetch route record
    const [routes] = await connection.query('SELECT * FROM routes WHERE delivery_id = ?', [delivery.id]);
    
    // Fetch full order, farmer, buyer & partner details
    const [details] = await connection.query(
      `SELECT 
        d.id AS delivery_id, d.order_id, d.delivery_status, d.estimated_delivery_date,
        d.pickup_address, d.pickup_district, d.pickup_state,
        d.delivery_address, d.delivery_district, d.delivery_state,
        o.order_number, o.total_amount, o.created_at AS order_date,
        o.delivery_name AS buyer_name, o.delivery_phone AS buyer_phone,
        u_farmer.full_name AS farmer_name, u_farmer.phone AS farmer_phone, u_farmer.farm_location,
        dp.full_name AS partner_name, dp.phone AS partner_phone, dp.vehicle_type, dp.vehicle_number
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN users u_farmer ON oi.farmer_id = u_farmer.id
       LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
       WHERE d.id = ?
       LIMIT 1`,
      [delivery.id]
    );

    const info = details.length > 0 ? details[0] : {};

    if (routes.length === 0) {
      // Return auto-computed default unoptimized structure
      const geoP = geocodeAddressFallback(delivery.pickup_address, delivery.pickup_district, delivery.pickup_state);
      const geoD = geocodeAddressFallback(delivery.delivery_address, delivery.delivery_district, delivery.delivery_state);
      const dist = calculateHaversineDistance(geoP.lat, geoP.lng, geoD.lat, geoD.lng);
      const spd = getSpeedByVehicleType(info.vehicle_type);
      const dur = Math.max(15, Math.round((dist / spd) * 60));

      return {
        ...info,
        route_id: null,
        pickup_latitude: geoP.lat,
        pickup_longitude: geoP.lng,
        delivery_latitude: geoD.lat,
        delivery_longitude: geoD.lng,
        total_distance_km: dist,
        estimated_duration_minutes: dur,
        average_speed_kmh: spd,
        route_classification: classifyDistance(dist),
        suggested_route_summary: 'Route not optimized yet. Click Optimize Route to finalize.',
        route_status: 'Not Optimized'
      };
    }

    const r = routes[0];
    return {
      ...info,
      route_id: r.id,
      pickup_latitude: parseFloat(r.pickup_latitude),
      pickup_longitude: parseFloat(r.pickup_longitude),
      delivery_latitude: parseFloat(r.delivery_latitude),
      delivery_longitude: parseFloat(r.delivery_longitude),
      total_distance_km: parseFloat(r.total_distance_km),
      estimated_duration_minutes: r.estimated_duration_minutes,
      average_speed_kmh: r.average_speed_kmh,
      route_classification: r.route_classification,
      suggested_route_summary: r.suggested_route_summary,
      route_status: r.route_status
    };
  } finally {
    connection.release();
  }
};

/**
 * Get All Routes for Admin Dashboard
 */
const getAllRoutes = async ({ status, search } = {}) => {
  const connection = await pool.getConnection();
  try {
    // Ensure delivery records exist for all orders
    const [allOrders] = await connection.query('SELECT id FROM orders');
    for (const ord of allOrders) {
      await ensureDeliveryRecord(ord.id);
    }

    const [deliveries] = await connection.query('SELECT id FROM deliveries');
    const result = [];

    for (const del of deliveries) {
      const routeData = await getRouteByDeliveryId(del.id);
      if (routeData) {
        // Filter by status if specified
        if (status && status !== 'All' && routeData.route_status !== status) {
          continue;
        }
        // Filter by search query if specified
        if (search && search.trim() !== '') {
          const s = search.trim().toLowerCase();
          const match = 
            (routeData.order_number && routeData.order_number.toLowerCase().includes(s)) ||
            (routeData.buyer_name && routeData.buyer_name.toLowerCase().includes(s)) ||
            (routeData.farmer_name && routeData.farmer_name.toLowerCase().includes(s)) ||
            (routeData.pickup_district && routeData.pickup_district.toLowerCase().includes(s)) ||
            (routeData.delivery_district && routeData.delivery_district.toLowerCase().includes(s));
          if (!match) continue;
        }
        result.push(routeData);
      }
    }

    return result;
  } finally {
    connection.release();
  }
};

module.exports = {
  geocodeAddressFallback,
  calculateHaversineDistance,
  classifyDistance,
  getSpeedByVehicleType,
  optimizeDeliveryRoute,
  getRouteByDeliveryId,
  getAllRoutes
};

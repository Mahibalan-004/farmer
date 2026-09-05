/**
 * Crop-Specific Default Images for Fallback
 * High quality Unsplash agricultural produce images for specific crops & categories
 */
const CROP_FALLBACK_IMAGES = {
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
  'tomatoes': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600',
  'onions': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
  'potatoes': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600',
  'carrots': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600',
  'chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600',
  'chillies': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600',
  'pepper': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600',
  'corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  'maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
  'paddy': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
  'wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600',
  'bananas': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600',
  'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
  'apples': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',
  'mangoes': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',
  'coconut': 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=600',
  'coconuts': 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=600',
  'garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600',
  'ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600',
  'turmeric': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600'
};

const CATEGORY_FALLBACK_IMAGES = {
  'Vegetables': 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600',
  'Fruits': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600',
  'Grains': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
  'Pulses': 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600',
  'Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600',
  'Default': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600'
};

/**
 * Returns formatted product image URL or a crop-specific default image.
 */
export const getProductImageUrl = (product) => {
  if (!product) return CATEGORY_FALLBACK_IMAGES['Default'];

  const rawUrl = product.image_url || product.img || product.image;

  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
      return rawUrl;
    }
    return `http://localhost:5000${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }

  // Fallback based on Crop Name
  const cropNameStr = (product.crop_name || product.product_name || '').toLowerCase();
  for (const [key, fallbackUrl] of Object.entries(CROP_FALLBACK_IMAGES)) {
    if (cropNameStr.includes(key)) {
      return fallbackUrl;
    }
  }

  // Fallback based on Category
  const cat = product.category;
  if (cat && CATEGORY_FALLBACK_IMAGES[cat]) {
    return CATEGORY_FALLBACK_IMAGES[cat];
  }

  return CATEGORY_FALLBACK_IMAGES['Default'];
};

/**
 * Handle image onError event gracefully by assigning crop-matched fallback image
 */
export const handleImageError = (e, product) => {
  e.target.onerror = null;
  const cropNameStr = (product?.crop_name || product?.product_name || '').toLowerCase();
  
  for (const [key, fallbackUrl] of Object.entries(CROP_FALLBACK_IMAGES)) {
    if (cropNameStr.includes(key)) {
      e.target.src = fallbackUrl;
      return;
    }
  }

  const cat = product?.category;
  if (cat && CATEGORY_FALLBACK_IMAGES[cat]) {
    e.target.src = CATEGORY_FALLBACK_IMAGES[cat];
    return;
  }

  e.target.src = CATEGORY_FALLBACK_IMAGES['Default'];
};

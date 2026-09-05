import React from 'react';

const DELIVERY_STAGES = [
  { key: 'Ready for Pickup', label: 'Ready for Pickup', icon: '📦', desc: 'Packed at Farm' },
  { key: 'Picked Up', label: 'Picked Up', icon: '🚚', desc: 'Collected by Partner' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🚚', desc: 'In Transit' },
  { key: 'Delivered', label: 'Delivered', icon: '🏠', desc: 'Delivered to Buyer' }
];

const DeliveryTracker = ({ status }) => {
  const normalizedStatus = status === 'Placed' ? 'Pending' : status;

  if (normalizedStatus === 'Cancelled') {
    return (
      <div className="delivery-tracker-cancelled">
        <span className="cancelled-badge-icon">❌</span>
        <div className="cancelled-text-block">
          <strong>Delivery Cancelled</strong>
          <p>Order has been cancelled. Pickup and delivery dispatches halted.</p>
        </div>
      </div>
    );
  }

  // Pre-pickup states (Pending, Confirmed, Processing)
  const isPrePickup = ['Pending', 'Placed', 'Confirmed', 'Processing'].includes(normalizedStatus);
  const activeIndex = isPrePickup ? -1 : DELIVERY_STAGES.findIndex(s => s.key === normalizedStatus);

  return (
    <div className="delivery-tracker-container">
      <div className="delivery-tracker-header font-sm color-muted mb-2">
        <span>🚚 Live Delivery Timeline</span>
        {isPrePickup && <span className="badge-preparing">🌾 Preparing at Farm...</span>}
      </div>

      <div className="delivery-tracker-timeline">
        {DELIVERY_STAGES.map((stage, index) => {
          const isCompleted = activeIndex > index;
          const isCurrent = activeIndex === index;
          const isFuture = activeIndex < index;

          let stageClass = 'delivery-stage-item';
          if (isCompleted) stageClass += ' stage-completed';
          if (isCurrent) stageClass += ' stage-current';
          if (isFuture) stageClass += ' stage-future';

          return (
            <React.Fragment key={stage.key}>
              <div className={stageClass}>
                <div className="stage-icon-node">
                  {isCompleted ? '✓' : stage.icon}
                </div>
                <div className="stage-labels">
                  <span className="stage-title">{stage.label}</span>
                  <span className="stage-subtitle">{stage.desc}</span>
                </div>
              </div>
              {index < DELIVERY_STAGES.length - 1 && (
                <div className={`stage-line-connector ${index < activeIndex ? 'line-active' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default DeliveryTracker;

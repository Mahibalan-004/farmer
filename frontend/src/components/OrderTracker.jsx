import React from 'react';

const ORDER_STEPS = [
  { key: 'Pending', label: 'Pending', icon: '🟡', desc: 'Order Placed' },
  { key: 'Confirmed', label: 'Confirmed', icon: '🟢', desc: 'Confirmed by Farmer' },
  { key: 'Processing', label: 'Processing', icon: '🔵', desc: 'Preparing & Packing' },
  { key: 'Shipped', label: 'Shipped', icon: '🚚', desc: 'Out for Delivery' },
  { key: 'Delivered', label: 'Delivered', icon: '📦', desc: 'Delivered Successfully' }
];

const OrderTracker = ({ status }) => {
  const normalizedStatus = status === 'Placed' ? 'Pending' : status;

  if (normalizedStatus === 'Cancelled') {
    return (
      <div className="order-tracker-cancelled-card">
        <div className="cancelled-icon-badge">❌</div>
        <div className="cancelled-info">
          <h4>Order Cancelled</h4>
          <p>This order was cancelled. Restored product quantity back to inventory.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex(step => step.key === normalizedStatus);
  const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0;

  return (
    <div className="order-tracker-container">
      <div className="order-tracker-steps">
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isFuture = index > activeIndex;

          let stepClass = 'order-step';
          if (isCompleted) stepClass += ' step-completed';
          if (isCurrent) stepClass += ' step-current';
          if (isFuture) stepClass += ' step-future';

          return (
            <React.Fragment key={step.key}>
              <div className={stepClass}>
                <div className="step-node">
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div className="step-content">
                  <span className="step-label">{step.label}</span>
                  <span className="step-desc">{step.desc}</span>
                </div>
              </div>
              {index < ORDER_STEPS.length - 1 && (
                <div className={`step-connector ${index < activeIndex ? 'connector-completed' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;

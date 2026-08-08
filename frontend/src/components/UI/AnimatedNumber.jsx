import React, { useEffect, useState } from 'react';

export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 400 }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    const endValue = Number(value);

    if (isNaN(endValue) || startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(startValue + progress * (endValue - startValue));
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formatted = typeof displayValue === 'number' ? displayValue.toLocaleString('en-IN') : displayValue;

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}


import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  from?: number;
  to: number;
  separator?: string;
  direction?: 'up' | 'down';
  duration?: number;
  className?: string;
}

const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to,
  separator = '',
  direction = 'up',
  duration = 1,
  className = ''
}) => {
  const [count, setCount] = useState(from);
  const countRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = direction === 'up' ? from : to;
    const endValue = direction === 'up' ? to : from;
    const totalChange = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(startValue + (totalChange * easeOutCubic));
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, from, to, direction, duration]);

  const formatNumber = (num: number) => {
    if (!separator) return num.toString();
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  };

  return (
    <span ref={countRef} className={className}>
      {formatNumber(count)}
    </span>
  );
};

export default CountUp;

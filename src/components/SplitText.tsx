
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines';
  from?: Record<string, any>;
  to?: Record<string, any>;
  threshold?: number;
  rootMargin?: string;
  textAlign?: 'left' | 'center' | 'right';
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'left',
  onLetterAnimationComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const elements = elementsRef.current;

    // Set initial state
    gsap.set(elements, from);

    // Create intersection observer for trigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate each element with stagger
            gsap.to(elements, {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              onComplete: () => {
                onLetterAnimationComplete?.();
              }
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [text, delay, duration, ease, from, to, threshold, rootMargin, onLetterAnimationComplete]);

  const splitText = () => {
    if (splitType === 'chars') {
      return text.split('').map((char, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) elementsRef.current[index] = el;
          }}
          className="inline-block"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </span>
      ));
    } else if (splitType === 'words') {
      return text.split(' ').map((word, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) elementsRef.current[index] = el;
          }}
          className="inline-block mr-1"
        >
          {word}
        </span>
      ));
    } else {
      return text.split('\n').map((line, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) elementsRef.current[index] = el;
          }}
          className="block"
        >
          {line}
        </div>
      ));
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ textAlign }}
    >
      {splitText()}
    </div>
  );
};

export default SplitText;

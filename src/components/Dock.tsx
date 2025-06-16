
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface DockItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
}

const Dock: React.FC<DockProps> = ({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
}) => {
  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        className="flex items-end gap-2 bg-background/80 backdrop-blur-md border border-border rounded-2xl px-4 py-2 shadow-lg"
        style={{ height: panelHeight }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            item={item}
            baseSize={baseItemSize}
            magnification={magnification}
          />
        ))}
      </motion.div>
    </div>
  );
};

interface DockItemProps {
  item: DockItem;
  baseSize: number;
  magnification: number;
}

const DockItem: React.FC<DockItemProps> = ({ item, baseSize, magnification }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  const size = useTransform(
    [mouseX, mouseY],
    ([latestX, latestY]) => {
      if (!isHovered) return baseSize;
      const distance = Math.sqrt(latestX * latestX + latestY * latestY);
      const maxDistance = 100;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      return baseSize + (magnification - baseSize) * (1 - normalizedDistance);
    }
  );

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 ${
        item.isActive 
          ? 'bg-primary text-primary-foreground shadow-md' 
          : 'hover:bg-accent text-muted-foreground hover:text-foreground'
      }`}
      style={{
        width: size,
        height: size,
        x,
        y,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={item.onClick}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="flex items-center justify-center"
        animate={{
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {item.icon}
      </motion.div>
      
      {/* Tooltip */}
      <motion.div
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs whitespace-nowrap shadow-lg border"
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 10,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: 'none' }}
      >
        {item.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
      </motion.div>
    </motion.div>
  );
};

export default Dock;

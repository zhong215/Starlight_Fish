import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface EtherealExploreButtonProps {
  onClick?: () => void;
  className?: string;
}

export const EtherealExploreButton: React.FC<EtherealExploreButtonProps> = ({ onClick, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group p-1 ${className}`}
    >
      {/* 背景紫色流光层 */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-2xl"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(129,140,248,0.32) 0%, transparent 70%)`,
        }}
      />

      {/* 按钮主体 */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="relative px-7 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full overflow-hidden transition-all duration-700 hover:border-indigo-300/70 hover:shadow-[0_0_16px_rgba(129,140,248,0.18)]"
        onClick={onClick}
        type="button"
        style={{ minWidth: 0 }}
      >
        {/* 内部紫色微光扫描 */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent -translate-x-full"
          animate={isHovered ? { translateX: ["100%", "-100%"] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        <div className="flex items-center space-x-2 relative z-10">
          <span className="text-indigo-300 font-extralight tracking-[0.32em] text-xs uppercase transition-colors duration-700 group-hover:text-indigo-200">
            Explore Case
          </span>

          <div className="relative flex items-center justify-center w-4 h-4">
            {/* 箭头动画（蓝紫色） */}
            <motion.svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 fill-none stroke-indigo-300 stroke-[1.5]"
              animate={isHovered ? { x: [0, 6, 0], opacity: [0.7, 1, 0.7] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </div>
        </div>

        {/* 底部装饰线（紫色脉冲） */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-300 to-transparent"
          initial={{ width: "0%" }}
          animate={isHovered ? { width: "60%", opacity: [0.3, 0.8, 0.3] } : { width: "0%" }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.button>

      {/* 鼠标跟随的紫色星尘点 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none w-1.5 h-1.5 bg-indigo-300 rounded-full blur-[1px] shadow-[0_0_8px_rgba(129,140,248,0.7)]"
            style={{
              left: mousePosition.x - 3,
              top: mousePosition.y - 3,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EtherealExploreButton;

import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface MonumentFlowchartProps {
  phase: number;
}

export const MonumentFlowchart: React.FC<MonumentFlowchartProps> = ({ phase }) => {
  // Isometric projection constants
  const isoX = (x: number, y: number) => (x - y) * 0.866;
  const isoY = (x: number, y: number, z: number) => (x + y) * 0.5 - z;

  // Define paths for different phases
  const paths = useMemo(() => [
    // Phase 1: Data Source -> ETL -> Warehouse -> Insight
    [
      { x: 0, y: 0, z: 0, label: "Data Source", color: "#f472b6" }, // Pink
      { x: 80, y: 0, z: 20, label: "ETL Process", color: "#38bdf8" }, // Blue
      { x: 80, y: 80, z: 40, label: "Warehouse", color: "#fbbf24" }, // Amber
      { x: 160, y: 80, z: 60, label: "Insight", color: "#34d399" }, // Emerald
    ],
    // Phase 2: Decoupling / Modular Design
    [
      { x: 0, y: 0, z: 0, label: "Monolith", color: "#94a3b8" }, // Slate
      { x: 0, y: 0, z: 60, label: "Decouple", color: "#818cf8" }, // Indigo
      { x: 60, y: 0, z: 60, label: "Module A", color: "#f87171" }, // Red
      { x: 60, y: 60, z: 60, label: "Module B", color: "#fb923c" }, // Orange
      { x: 120, y: 60, z: 60, label: "System", color: "#2dd4bf" }, // Teal
    ]
  ], []);

  const currentPath = paths[phase % paths.length] || paths[0];

  // Generate SVG path string from isometric coordinates
  const pathData = currentPath.map((p, i) => {
    const x = isoX(p.x, p.y) + 200;
    const y = isoY(p.x, p.y, p.z) + 150;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
        {/* Decorative isometric grid lines */}
        <g opacity="0.03" stroke="white" strokeWidth="0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={isoX(i * 40 - 200, -200) + 200} y1={isoY(i * 40 - 200, -200, 0) + 150} x2={isoX(i * 40 - 200, 400) + 200} y2={isoY(i * 40 - 200, 400, 0) + 150} />
              <line x1={isoX(-200, i * 40 - 200) + 200} y1={isoY(-200, i * 40 - 200, 0) + 150} x2={isoX(400, i * 40 - 200) + 200} y2={isoY(400, i * 40 - 200, 0) + 150} />
            </React.Fragment>
          ))}
        </g>

        {/* The Flow Path - Glowing line */}
        <motion.path
          d={pathData}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        <motion.path
          d={pathData}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          strokeDasharray="2 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />

        {/* Isometric Blocks */}
        {currentPath.map((p, i) => {
          const x = isoX(p.x, p.y) + 200;
          const y = isoY(p.x, p.y, p.z) + 150;
          
          return (
            <g key={i} className="group">
              {/* Cube representation with Monument Valley colors */}
              <motion.path
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                d={`
                  M ${x} ${y} 
                  L ${x + 20} ${y - 11.5} 
                  L ${x} ${y - 23} 
                  L ${x - 20} ${y - 11.5} Z
                `}
                fill={p.color}
                fillOpacity="0.4"
                className="group-hover:fill-opacity-80 transition-all duration-700"
              />
              <motion.path
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                d={`
                  M ${x} ${y} 
                  L ${x - 20} ${y - 11.5} 
                  L ${x - 20} ${y + 18.5} 
                  L ${x} ${y + 30} Z
                `}
                fill={p.color}
                fillOpacity="0.2"
              />
              <motion.path
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 100 }}
                d={`
                  M ${x} ${y} 
                  L ${x + 20} ${y - 11.5} 
                  L ${x + 20} ${y + 18.5} 
                  L ${x} ${y + 30} Z
                `}
                fill={p.color}
                fillOpacity="0.1"
              />
              
              {/* Label - Floating above */}
              <motion.text
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ delay: i * 0.15 + 0.4 }}
                x={x}
                y={y - 35}
                textAnchor="middle"
                className="text-[7px] font-mono fill-white tracking-[0.2em] uppercase font-light"
              >
                {p.label}
              </motion.text>
            </g>
          );
        })}

        {/* The Animated Fish - Following the path */}
        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            offsetPath: `path("${pathData}")`,
            offsetRotate: "auto"
          }}
        >
          {/* Fish Body - Glowing and fluid */}
          <motion.path
            d="M 10 0 Q 5 4 -5 0 Q 5 -4 10 0"
            fill="white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            className="blur-[1px]"
          >
            <animate
              attributeName="d"
              values="M 10 0 Q 5 4 -5 0 Q 5 -4 10 0; M 10 0 Q 5 2 -5 0 Q 5 -2 10 0; M 10 0 Q 5 4 -5 0 Q 5 -4 10 0"
              dur="0.8s"
              repeatCount="indefinite"
            />
          </motion.path>
          
          {/* Tail */}
          <motion.path
            d="M -5 0 L -12 6 L -10 0 L -12 -6 Z"
            fill="white"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 -5 0; 15 -5 0; -15 -5 0; 0 -5 0"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </motion.path>

          {/* Glow */}
          <circle r="12" fill="white" opacity="0.1" className="blur-[8px]" />
          <circle r="4" fill="white" opacity="0.3" className="blur-[2px]" />
        </motion.g>
      </svg>
      
      {/* Decorative floating elements - Sacred glow */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 底层：柔和金色光晕 */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-amber-200/2 via-amber-100/2 to-yellow-50/1 blur-[60px] rounded-full sacred-glow" />
        {/* 顶层：轻柔白色光芒 */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/3 blur-[60px] rounded-full sacred-glow" />
        
        {/* 底层：柔和金色光晕 */}
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-amber-200/2 via-amber-100/2 to-yellow-50/1 blur-[80px] rounded-full sacred-glow-delayed" />
        {/* 顶层：轻柔白色光芒 */}
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/3 blur-[80px] rounded-full sacred-glow-delayed" />
      </div>
    </div>
  );
};

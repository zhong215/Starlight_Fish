import React from 'react';
import { motion } from 'motion/react';

/**
 * 向下三角指示器组件 - 用于"要有光"章节
 * 空灵神圣风格，带有青绿色生物发光效果
 */
export const RotationIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 2, ease: "easeOut" }}
      className="flex flex-col items-center justify-center space-y-3"
    >
      {/* 竖排"拨转"文字 - 放在上方 */}
      <motion.div
        animate={{
          opacity: [0.6, 0.9, 0.6]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="relative"
      >
        <span 
          className="text-teal-200/70 text-[10px] tracking-[0.8em] font-light font-serif bioluminescent-text"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            letterSpacing: '0.8em',
            textShadow: '0 0 6px rgba(94,234,212,0.5), 0 0 12px rgba(56,189,248,0.3)'
          }}
        >
          拨转
        </span>
      </motion.div>

      {/* 向下三角图标 */}
      <motion.div
        animate={{
          y: [0, 10, 0],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative flex items-center justify-center"
      >
        {/* 背景光晕 */}
        <div className="absolute inset-0 w-20 h-20 bg-gradient-radial from-teal-400/15 via-cyan-400/8 to-transparent blur-[50px] -z-10" />
        
        {/* SVG 三角形 */}
        <svg 
          width="32" 
          height="40" 
          viewBox="0 0 32 40" 
          className="triangle-glow"
          style={{ filter: 'url(#tealGlow)' }}
        >
          <defs>
            {/* 多层发光滤镜 */}
            <filter id="tealGlow" x="-200%" y="-200%" width="500%" height="500%">
              {/* 内层强光 */}
              <feGaussianBlur stdDeviation="3" result="blur1"/>
              <feColorMatrix 
                in="blur1" 
                type="matrix" 
                values="0 0 0 0 0.368
                        0 0 0 0 0.917
                        0 0 0 0 0.831
                        0 0 0 0.8 0" 
                result="glow1"
              />
              
              {/* 中层光晕 */}
              <feGaussianBlur stdDeviation="6" result="blur2"/>
              <feColorMatrix 
                in="blur2" 
                type="matrix" 
                values="0 0 0 0 0.220
                        0 0 0 0 0.741
                        0 0 0 0 0.973
                        0 0 0 0.5 0" 
                result="glow2"
              />
              
              {/* 外层扩散 */}
              <feGaussianBlur stdDeviation="12" result="blur3"/>
              <feColorMatrix 
                in="blur3" 
                type="matrix" 
                values="0 0 0 0 0.055
                        0 0 0 0 0.647
                        0 0 0 0 0.914
                        0 0 0 0.3 0" 
                result="glow3"
              />
              
              {/* 最外层微光 */}
              <feGaussianBlur stdDeviation="20" result="blur4"/>
              <feColorMatrix 
                in="blur4" 
                type="matrix" 
                values="0 0 0 0 0.368
                        0 0 0 0 0.917
                        0 0 0 0 0.831
                        0 0 0 0.15 0" 
                result="glow4"
              />
              
              {/* 合并所有层 */}
              <feMerge>
                <feMergeNode in="glow4"/>
                <feMergeNode in="glow3"/>
                <feMergeNode in="glow2"/>
                <feMergeNode in="glow1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* 渐变填充 */}
            <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(153,246,228,0.25)" />
              <stop offset="100%" stopColor="rgba(153,246,228,0.08)" />
            </linearGradient>
          </defs>
          
          {/* 三角形多边形 - 空心描边样式 - 倒三角（顶点朝下） */}
          <motion.polygon
            points="16,35 28,5 4,5"
            fill="url(#triangleGradient)"
            stroke="rgba(153,246,228,0.8)"
            strokeWidth="2"
            strokeLinejoin="round"
            animate={{
              strokeOpacity: [0.6, 1, 0.6],
              fillOpacity: [0.15, 0.3, 0.15]
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* 内部光点 - 增强中心发光 */}
          <motion.circle
            cx="16"
            cy="17"
            r="2"
            fill="rgba(153,246,228,0.9)"
            animate={{
              opacity: [0.5, 1, 0.5],
              r: [1.5, 2.5, 1.5]
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

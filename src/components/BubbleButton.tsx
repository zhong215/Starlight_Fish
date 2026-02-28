import React, { useState } from 'react';

/**
 * BubbleButton 空灵泡泡按钮组件
 * 复刻自参考代码，支持多层光效、浮动动画、交互反馈。
 * 可用于“很高兴认识你”界面左下角。
 */
interface BubbleButtonProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  verticalOffset?: number;
  horizontalOffset?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  horizontalDirection?: 'left' | 'right';
}

const BubbleButton: React.FC<BubbleButtonProps> = ({
  className = '',
  style,
  onClick,
  verticalOffset = 0,
  horizontalOffset = 0,
  top,
  left,
  right,
  bottom,
  horizontalDirection = 'right',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const isLeftDirection = horizontalDirection === 'left';

  // 合并定位样式
  const positionStyle: React.CSSProperties = {
    ...(typeof top === 'number' ? { top } : {}),
    ...(typeof left === 'number' ? { left } : {}),
    ...(typeof right === 'number' ? { right } : {}),
    ...(typeof bottom === 'number' ? { bottom } : {}),
    ...(top !== undefined || left !== undefined || right !== undefined || bottom !== undefined
      ? { position: 'absolute' }
      : {}),
    ...(verticalOffset !== 0 ? { marginTop: verticalOffset } : {}),
    ...(horizontalOffset !== 0 ? { marginLeft: horizontalOffset } : {}),
    ...style,
  };

  return (
    <div className={`relative z-10 flex flex-col items-center group ${className}`} style={positionStyle}>
      {/* 交互容器：大幅度弹动效果 */}
      <div
        className={`relative transition-all duration-[600ms] ease-[cubic-bezier(0.175,0.885,0.32,1.5)] 
          ${isPressed ? 'scale-[0.8] rotate-1' : 'group-hover:scale-125 active:scale-75'}`}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        {/* 常驻外溢微光 - 金色暖光 */}
        <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-[40px] animate-pulse"></div>
        {/* 点击时的爆发强光 - 模拟阳光穿透感 */}
        <div className={`absolute inset-[-30px] rounded-full bg-yellow-400/30 blur-[60px] transition-opacity duration-300 
          ${isPressed ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}></div>
        {/* 泡泡底部的暖虹彩层 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-400/15 via-yellow-200/20 to-amber-100/10 blur-2xl opacity-40 group-hover:opacity-100 animate-spin-slow transition-opacity duration-1000"></div>
        {/* 核心“空灵气泡”主体 */}
        <button
          className="relative w-40 h-40 flex items-center justify-center
            bg-white/[0.01] backdrop-blur-[60px] border border-white/20
            rounded-full shadow-[inset_0_0_50px_rgba(255,255,255,0.1),0_30px_60px_rgba(0,0,0,0.4)]
            animate-float-large transition-all duration-700
            hover:border-amber-200/40 group-hover:shadow-[inset_0_0_80px_rgba(251,191,36,0.15),0_0_40px_rgba(251,191,36,0.2)]"
          onClick={onClick}
          type="button"
        >
          {/* 内部常驻核心光辉 - 模拟图中那种温暖的扩散光 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 bg-amber-400/15 rounded-full blur-[35px] animate-pulse"></div>
          </div>
          {/* 增强的阳光高光反射 */}
          <div
            className={`absolute top-[8%] w-[45%] h-[25%] bg-gradient-to-b from-white/30 to-transparent rounded-[100%] blur-[2px] ${
              isLeftDirection ? 'right-[15%] rotate-[25deg]' : 'left-[15%] rotate-[-25deg]'
            }`}
          ></div>
          {/* 边缘细微的金色勾边 */}
          <div className="absolute inset-0 rounded-full border border-transparent [mask-image:linear-gradient(white,transparent)] border-t-amber-200/30 border-l-amber-100/20"></div>
          {/* 核心强光源 - 点击触发更亮的“日光爆发” */}
          <div className={`absolute w-4 h-4 bg-amber-100 rounded-full blur-md transition-all duration-300
            ${isPressed ? 'scale-[5] opacity-100 shadow-[0_0_40px_#fbbf24]' : 'scale-100 opacity-40 animate-ping'}`}></div>
          <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_#fff]"></div>
          {/* 内容排版：保持竖排禅意 */}
          <div className="relative flex flex-col items-center tracking-[1.2em] text-white/60 group-hover:text-white transition-all duration-1000">
            <span className={`${isLeftDirection ? '[writing-mode:vertical-lr]' : '[writing-mode:vertical-rl]'} font-extralight text-lg select-none`}>
              与我联系
            </span>
          </div>
          {/* 内部游动的小碎光 */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className={`absolute top-1/2 w-1.5 h-1.5 bg-amber-100/30 rounded-full ${
                isLeftDirection ? 'right-1/4 animate-float-inside-left' : 'left-1/4 animate-float-inside'
              }`}
            ></div>
            <div
              className={`absolute bottom-1/3 w-2 h-2 bg-yellow-200/20 rounded-full [animation-delay:2s] ${
                isLeftDirection ? 'left-1/4 animate-float-inside-left' : 'right-1/4 animate-float-inside'
              }`}
            ></div>
          </div>
        </button>
        {/* 泡泡倒影 - 暖色调 */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-40 h-6 bg-amber-400/5 rounded-[100%] blur-xl scale-x-150 group-hover:opacity-40 transition-all duration-700"></div>
      </div>
      {/* 动画 keyframes 注入，可根据需要移至全局样式 */}
      <style>{`
        @keyframes float-large {
          0%, 100% { transform: translateY(0) rotate(0deg); border-radius: 50%; }
          33% { transform: translateY(-45px) rotate(3deg) scaleX(1.05); border-radius: 46% 54% 44% 56% / 54% 46% 54% 46%; }
          66% { transform: translateY(20px) rotate(-3deg) scaleX(0.95); border-radius: 54% 46% 56% 44% / 46% 54% 44% 56%; }
        }
        @keyframes rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.3; }
          80% { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(1.8); opacity: 0; }
        }
        @keyframes float-inside {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50% { transform: translate(35px, -35px); opacity: 0.6; }
        }
        @keyframes float-inside-left {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50% { transform: translate(-35px, -35px); opacity: 0.6; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float-large {
          animation: float-large 9s ease-in-out infinite;
        }
        .animate-rise {
          animation: rise linear infinite;
        }
        .animate-float-inside {
          animation: float-inside 7s ease-in-out infinite;
        }
        .animate-float-inside-left {
          animation: float-inside-left 7s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 18s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BubbleButton;

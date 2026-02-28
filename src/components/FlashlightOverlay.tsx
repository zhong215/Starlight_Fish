import React, { useState, useEffect, useCallback } from 'react';

interface FlashlightOverlayProps {
  isActive: boolean;
  onPositionChange?: (position: { x: number; y: number } | null) => void;
  lightRadius?: number;
  children: React.ReactNode;
}

export const FlashlightOverlay: React.FC<FlashlightOverlayProps> = ({
  isActive,
  onPositionChange,
  lightRadius = 135, // 中小光圈
  children
}) => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // 节流更新鼠标位置（性能优化）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    const x = e.clientX;
    const y = e.clientY;
    
    setMousePos({ x, y });
    onPositionChange?.({ x, y });
  }, [isActive, onPositionChange]);

  // 触摸事件处理（移动端适配）
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isActive || e.touches.length === 0) return;

    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    setMousePos({ x, y });
    onPositionChange?.({ x, y });
  }, [isActive, onPositionChange]);

  useEffect(() => {
    if (!isActive) {
      setMousePos(null);
      onPositionChange?.(null);
      return;
    }

    // 添加事件监听器
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isActive, handleMouseMove, handleTouchMove, onPositionChange]);

  // 计算遮罩样式
  const getMaskStyle = () => {
    if (!mousePos) {
      return {
        maskImage: 'none',
        WebkitMaskImage: 'none',
      };
    }

    // 计算百分比位置（相对于视口）
    const xPercent = (mousePos.x / window.innerWidth) * 100;
    const yPercent = (mousePos.y / window.innerHeight) * 100;

    // 移动端降级：光圈减小
    const isMobile = window.innerWidth < 768;
    const actualRadius = isMobile ? lightRadius * 0.7 : lightRadius;

    // 创建径向渐变遮罩
    // 中心完全透明 -> 边缘柔和过渡 -> 完全遮挡
    const maskValue = `radial-gradient(
      circle ${actualRadius}px at ${xPercent}% ${yPercent}%,
      rgba(0,0,0,1) 0%,
      rgba(0,0,0,0.9) 40%,
      rgba(0,0,0,0.5) 70%,
      rgba(0,0,0,0) 100%
    )`;

    return {
      maskImage: maskValue,
      WebkitMaskImage: maskValue,
    };
  };

  return (
    <div className="relative w-full">
      {/* 底层：极淡轮廓（未照亮状态） */}
      <div className="opacity-[0.05]">
        {children}
      </div>

      {/* 顶层：手电筒照亮区域（带遮罩） */}
      {isActive && (
        <div
          className="absolute inset-0 transition-opacity duration-800"
          style={{
            ...getMaskStyle(),
            willChange: 'mask-image',
          }}
        >
          {/* 呼吸光晕动画 */}
          <div 
            className="absolute inset-0"
            style={{
              pointerEvents: 'none',
            }}
          >
            {mousePos && (
              <div
                className="absolute rounded-full transition-all duration-200 ease-out"
                style={{
                  left: `${mousePos.x}px`,
                  top: `${mousePos.y}px`,
                  width: `${lightRadius * 2}px`,
                  height: `${lightRadius * 2}px`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 40px rgba(94, 234, 212, 0.3), 0 0 70px rgba(56, 189, 248, 0.2), 0 0 100px rgba(14, 165, 233, 0.1)',
                  animation: 'flashlightBreath 4s ease-in-out infinite',
                }}
              />
            )}
          </div>

          {/* 完全显现的内容 */}
          <div className="transition-opacity duration-800">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { audioManager } from '../utils/audio';

// CSS涟漪层接口
interface CSSRipple {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  blur: number;
  borderW: number;
  color: string;
}

interface Mote {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
}

interface WhaleCallButtonProps {
  onUnlock?: () => void;
}

// CSS涟漪层组件
const RippleLayer: React.FC<CSSRipple & { onComplete: () => void }> = ({
  x,
  y,
  size,
  duration,
  delay,
  opacity,
  blur,
  borderW,
  color,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, (duration + delay) * 1000 + 100);
    return () => clearTimeout(timer);
  }, [onComplete, duration, delay]);

  return (
    <div
      className="fixed pointer-events-none rounded-full z-[5]"
      style={{
        left: x,
        top: y,
        width: '1px',
        height: '1px',
        transform: 'translate(-50%, -50%)',
        border: `${borderW}px solid ${color}`,
        boxShadow:
          blur > 0 ? `0 0 ${blur}px ${color.replace(/[\d.]+\)$/, '0.3)')}` : 'none',
        filter: blur > 0 ? `blur(${blur / 3}px)` : 'none',
        animation: `sky-ripple-expansive ${duration}s cubic-bezier(0.1, 0, 0.2, 1) ${delay}s forwards`,
        willChange: 'transform, opacity',
        // @ts-ignore
        '--target-size': `${size}px`,
      }}
    />
  );
};

export const WhaleCallButton: React.FC<WhaleCallButtonProps> = ({ onUnlock }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayable, setIsPlayable] = useState(true); // 是否可以点击
  const [playProgress, setPlayProgress] = useState(0); // 播放进度 0-1
  const [cssRipples, setCssRipples] = useState<CSSRipple[]>([]); // CSS涟漪
  const [motes, setMotes] = useState<Mote[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const progressAnimationRef = useRef<number | undefined>(undefined);
  
  const MAX_CLICKS = 3;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 初始化发光微粒（移动端适配）
  useEffect(() => {
    const moteCount = isMobile ? 20 : 40;
    const initialMotes: Mote[] = [];
    for (let i = 0; i < moteCount; i++) {
      initialMotes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }
    setMotes(initialMotes);
  }, [isMobile]);

  // Canvas动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置Canvas尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制微粒
      motes.forEach((mote) => {
        mote.x += mote.vx;
        mote.y += mote.vy;

        // 边界检查
        if (mote.x < 0 || mote.x > canvas.width) mote.vx *= -1;
        if (mote.y < 0 || mote.y > canvas.height) mote.vy *= -1;

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.fillStyle = `rgba(255, 255, 255, ${mote.alpha})`;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Canvas涟漪已移除，使用CSS涟漪代替

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [motes]);

  // CSS涟漪清理回调
  const removeRipple = useCallback((id: string) => {
    setCssRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // 点击处理 - 顺序播放：进度条 → 声音
  const handleClick = async () => {
    // 只有在可播放且未转场时才响应点击
    if (!isPlayable || isTransitioning) {
      console.log('Button not playable, ignoring click');
      return;
    }

    console.log('=== Whale button clicked ===');

    // 获取按钮中心位置（相对于视口）
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const timestamp = Date.now();

    // 标记为不可点击，锁定按钮
    setIsPlayable(false);
    setIsPlaying(true);
    setPlayProgress(0.001); // 立即设置一个很小的初始值，确保视觉反馈

    // 初始化音频上下文
    audioManager.init();

    // 进度条动画时长（毫秒）
    const PROGRESS_DURATION = 3000;
    const AUDIO_DELAY = 400; // 声音延迟 400ms，确保进度条明显先开始

    // 开始进度条动画
    const startTime = Date.now();
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / PROGRESS_DURATION, 1);
      setPlayProgress(progress);

      if (progress < 1) {
        progressAnimationRef.current = requestAnimationFrame(animateProgress);
      }
    };
    
    // 使用 RAF 确保进度条动画立即在下一帧开始
    requestAnimationFrame(() => {
      animateProgress();
    });

    // 延迟播放声音和涟漪效果（确保进度条先开始）
    setTimeout(async () => {
      console.log('Starting whale call audio...');
      
      // 创建4层CSS涟漪（白→青渐变）
      const scaleFactor = isMobile ? 0.7 : 1;
      const layers = [
        {
          id: 'core',
          size: 300 * scaleFactor,
          duration: 1.2,
          delay: 0,
          opacity: 0.7,
          blur: 0,
          borderW: 1.5,
          color: 'rgba(255, 255, 255, 0.9)',
        },
        {
          id: 'main',
          size: 850 * scaleFactor,
          duration: 2.8,
          delay: 0.05,
          opacity: 0.4,
          blur: 2,
          borderW: 0.8,
          color: 'rgba(200, 240, 250, 0.6)',
        },
        {
          id: 'horizon',
          size: 1500 * scaleFactor,
          duration: 4.0,
          delay: 0.2,
          opacity: 0.2,
          blur: 1,
          borderW: 0.4,
          color: 'rgba(94, 234, 212, 0.4)',
        },
        {
          id: 'atmosphere',
          size: 2000 * scaleFactor,
          duration: 3.5,
          delay: 0.1,
          opacity: 0.15,
          blur: 40,
          borderW: 0.2,
          color: 'rgba(94, 234, 212, 0.2)',
        },
      ];

      setCssRipples((prev) => [
        ...prev,
        ...layers.map((l) => ({
          ...l,
          id: `${timestamp}-${l.id}`,
          x: centerX,
          y: centerY,
        })),
      ]);

      // 播放鲸鱼音效并等待播放完成
      try {
        await audioManager.playWhaleCall();
        console.log('Whale call finished playing');
      } catch (error) {
        console.error('Error playing whale call:', error);
      }
    }, AUDIO_DELAY);

    // 等待进度条动画和声音都完成
    await new Promise(resolve => setTimeout(resolve, Math.max(PROGRESS_DURATION, AUDIO_DELAY + 3000)));

    // 播放完成，恢复状态
    setIsPlaying(false);
    setPlayProgress(0);

    // 更新点击计数
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    // 检查是否达到3次点击
    if (nextCount >= MAX_CLICKS && onUnlock) {
      // 触发解锁
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          onUnlock();
          // 解锁后重置状态
          setTimeout(() => {
            setClickCount(0);
            setIsTransitioning(false);
            setIsPlayable(true);
          }, 1000);
        }, 800);
      }, 500);
    } else {
      // 未达到3次，允许再次点击
      setIsPlayable(true);
    }
  };

  // SVG进度环计算（按钮边框进度）
  const radius = 26; // 按钮大小 w-14 = 56px，半径 28px，减2px避免裁剪
  const circumference = 2 * Math.PI * radius;
  // 播放中显示实时进度，空闲时显示累计点击进度
  const currentProgress = isPlaying ? playProgress : clickCount / MAX_CLICKS;
  const strokeDashoffset = circumference * (1 - currentProgress);

  return (
    <>
      {/* 背景Canvas - 全屏覆盖 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* CSS涟漪层 - 全屏覆盖 */}
      {cssRipples.map((ripple) => (
        <RippleLayer key={ripple.id} {...ripple} onComplete={() => removeRipple(ripple.id)} />
      ))}

      {/* 按钮容器 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className={`relative mt-16 flex flex-col items-center transition-all duration-700 ${
          isTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        }`}
      >
        {/* 核心圆形容器 */}
        <div
          ref={buttonRef}
          className="relative flex flex-col items-center justify-center cursor-pointer group"
          onClick={handleClick}
        >
          {/* 呼吸的核心圆环（带进度条边框） */}
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center relative backdrop-blur-sm bg-teal-500/5"
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 14px 3px rgba(94, 234, 212, 0.2)',
                '0 0 20px 6px rgba(94, 234, 212, 0.4)',
                '0 0 14px 3px rgba(94, 234, 212, 0.2)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.1,
            }}
            whileTap={{
              scale: 0.95,
            }}
            style={{ willChange: 'transform' }}
          >
            {/* SVG进度环边框 */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* 底色环 */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="rgba(94, 234, 212, 0.1)"
                strokeWidth="1"
              />
              {/* 进度环 */}
              <circle
                cx="28"
                cy="28"
                r={radius}
                fill="none"
                stroke="rgba(94, 234, 212, 0.8)"
                strokeWidth="1.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000"
                style={{ filter: 'drop-shadow(0 0 2px rgba(94, 234, 212, 0.6))' }}
              />
            </svg>
            {/* 内部星核 */}
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                boxShadow: '0 0 14px 3px rgba(255, 255, 255, 0.8)',
              }}
            />
          </motion.div>

          {/* 文字提示 - 微光版 */}
          <div className="mt-10 text-center">
            <motion.p
              className={`text-sm tracking-[0.8em] uppercase font-light transition-opacity duration-700 ${
                isPlaying 
                  ? 'opacity-90 text-white' 
                  : 'opacity-0 text-white group-hover:opacity-100'
              }`}
              style={{
                textShadow: '0 0 4px rgba(94, 234, 212, 1), 0 0 8px rgba(94, 234, 212, 0.9), 0 0 12px rgba(94, 234, 212, 0.8), 0 0 16px rgba(94, 234, 212, 0.6)',
                filter: 'drop-shadow(0 0 8px rgba(94, 234, 212, 0.9)) drop-shadow(0 0 13px rgba(94, 234, 212, 0.6))',
              }}
              animate={{
                textShadow: [
                  '0 0 4px rgba(94, 234, 212, 1), 0 0 8px rgba(94, 234, 212, 0.9), 0 0 12px rgba(94, 234, 212, 0.8), 0 0 16px rgba(94, 234, 212, 0.6)',
                  '0 0 6px rgba(94, 234, 212, 1), 0 0 12px rgba(94, 234, 212, 1), 0 0 18px rgba(94, 234, 212, 0.9), 0 0 24px rgba(94, 234, 212, 0.8)',
                  '0 0 4px rgba(94, 234, 212, 1), 0 0 8px rgba(94, 234, 212, 0.9), 0 0 12px rgba(94, 234, 212, 0.8), 0 0 16px rgba(94, 234, 212, 0.6)'
                ],
                y: [0, -2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              呼唤
            </motion.p>
            {!isPlaying && (
              <motion.p
                className="text-[9px] tracking-[0.6em] uppercase font-light mt-3 transition-opacity duration-500 text-white/30 group-hover:text-white/50"
                style={{
                  textShadow: '0 0 3px rgba(94, 234, 212, 0.4), 0 0 6px rgba(94, 234, 212, 0.2)',
                }}
                animate={{
                  y: [0, -2, 0],
                  textShadow: [
                    '0 0 3px rgba(94, 234, 212, 0.4), 0 0 6px rgba(94, 234, 212, 0.2)',
                    '0 0 5px rgba(94, 234, 212, 0.6), 0 0 10px rgba(94, 234, 212, 0.4)',
                    '0 0 3px rgba(94, 234, 212, 0.4), 0 0 6px rgba(94, 234, 212, 0.2)',
                  ],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              >
                Whale Song
              </motion.p>
            )}
          </div>
        </div>

        {/* 底部装饰线 */}
        <motion.div
          className="mt-12 w-px h-16 bg-gradient-to-b from-teal-500/20 to-transparent"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
        />
      </motion.div>

      {/* CSS动画样式 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes sky-ripple-expansive {
            0% { width: 1px; height: 1px; opacity: 0; }
            10% { opacity: 1; }
            100% { 
              width: var(--target-size); 
              height: var(--target-size); 
              opacity: 0; 
            }
          }
        `
      }} />
    </>
  );
};

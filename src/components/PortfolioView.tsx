import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Mail, Phone, MessageCircle, Github, Linkedin, ExternalLink, Fish, X } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { FlashlightOverlay } from './FlashlightOverlay';
import { WhaleCallButton } from './WhaleCallButton';
import { EtherealExploreButton } from './EtherealExploreButton';
import BubbleButton from './BubbleButton';
import { RotationIndicator } from './RotationIndicator';

interface FishPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface VineNode {
  x: number;
  y: number;
  strength: number;
}

// 粒子接口
interface DustParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

// 大地裂缝组件
interface AbyssalCrackProps {
  onEnter: () => void;
  text?: string;
  position?: 'bottom' | 'top';
  onHoverChange?: (isHovered: boolean, position: { x: number; y: number } | null) => void;
  crackRef?: React.RefObject<HTMLDivElement>;
  isDrillingOut?: boolean; // 钻出状态：发光但不显示文字
}

// 竖排文字组件：每个字符独立动画
interface VerticalTextProps {
  text: string;
  className?: string;
  charDelay?: number;
}

const VerticalText: React.FC<VerticalTextProps> = ({ text, className = '', charDelay = 0 }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {text.split('').map((char, i) => (
        <span 
          key={i} 
          className="transition-all duration-[3000ms] inline-block"
          style={{ 
            marginBottom: '1.6em', 
            opacity: mounted ? 1 : 0,
            transitionDelay: `${charDelay + (i * 200)}ms`,
            transform: mounted ? 'translateY(0)' : 'translateY(15px)'
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

const AbyssalCrack: React.FC<AbyssalCrackProps> = ({ 
  onEnter, 
  text = '遁入', 
  position = 'bottom',
  onHoverChange,
  crackRef,
  isDrillingOut = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  // 合并悬停状态和钻出状态：任一为true都显示发光效果
  const isGlowing = isHovered || isDrillingOut;
  const [particles, setParticles] = useState<DustParticle[]>([]);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = crackRef || internalContainerRef;
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // 初始化粒子
  useEffect(() => {
    const initialParticles: DustParticle[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;
      const baseAlpha = Math.random() * 0.2 + 0.05;
      initialParticles.push({
        id: particleIdRef.current++,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: baseAlpha,
        baseAlpha
      });
    }
    setParticles(initialParticles);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 粒子动画循环 - 模拟大地裂缝的负压吸力
  useEffect(() => {
    const animate = () => {
      setParticles(prev => {
        return prev.map(p => {
          let newVx = p.vx;
          let newVy = p.vy;
          let newAlpha = p.alpha;

          // 计算到裂缝中心的距离
          const dx = -p.x;
          const dy = -p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (isGlowing && dist < 400) {
            // 模拟大地裂缝产生的"负压"吸力
            const force = Math.pow((400 - dist) / 400, 1.5);
            newVx += dx * 0.0015 * force;
            newVy += dy * 0.0015 * force;
            newAlpha = Math.min(0.8, newAlpha + 0.02);

            // 粒子在裂口中心"坠落"消散
            if (Math.abs(p.x) < 15 && Math.abs(p.y) < 100) {
              newAlpha *= 0.9;
              const newSize = p.size * 0.95;
              
              // 如果粒子消散，重置到远处
              if (newAlpha < 0.05) {
                const resetAngle = Math.random() * Math.PI * 2;
                const resetDist = 100 + Math.random() * 200;
                return {
                  ...p,
                  x: Math.cos(resetAngle) * resetDist,
                  y: Math.sin(resetAngle) * resetDist,
                  vx: (Math.random() - 0.5) * 0.3,
                  vy: (Math.random() - 0.5) * 0.3,
                  alpha: p.baseAlpha,
                  size: Math.random() * 1.5 + 0.5
                };
              }
              
              return {
                ...p,
                x: p.x + newVx,
                y: p.y + newVy,
                vx: newVx,
                vy: newVy,
                alpha: newAlpha,
                size: newSize
              };
            }
          } else {
            // 正常漂浮
            newVx += (Math.random() - 0.5) * 0.02;
            newVy += (Math.random() - 0.5) * 0.02;
            newAlpha = Math.max(p.baseAlpha, newAlpha - 0.005);
            
            // 限速
            const speed = Math.sqrt(newVx * newVx + newVy * newVy);
            if (speed > 1) {
              newVx = (newVx / speed) * 1;
              newVy = (newVy / speed) * 1;
            }
          }

          const newX = p.x + newVx;
          const newY = p.y + newVy;

          // 边界检查 - 重置到边缘
          if (Math.abs(newX) > 400 || Math.abs(newY) > 400) {
            const resetAngle = Math.random() * Math.PI * 2;
            const resetDist = 100 + Math.random() * 200;
            return {
              ...p,
              x: Math.cos(resetAngle) * resetDist,
              y: Math.sin(resetAngle) * resetDist,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
              alpha: p.baseAlpha
            };
          }

          return {
            ...p,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            alpha: newAlpha
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isGlowing]);

  // 监听 hover 状态变化并通知父组件
  useEffect(() => {
    if (onHoverChange && containerRef.current) {
      if (isHovered) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        onHoverChange(true, { x: centerX, y: centerY });
      } else {
        onHoverChange(false, null);
      }
    }
  }, [isHovered, onHoverChange]);

  return (
    <div
      ref={containerRef}
      className={`absolute ${position === 'bottom' ? 'bottom-12' : 'top-12'} left-1/2 -translate-x-1/2 cursor-pointer group`}
      style={{ width: '180px', height: '300px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEnter}
    >
      {/* 粒子层 - 尘埃 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `calc(50% + ${particle.x}px)`,
              top: `calc(50% + ${particle.y}px)`,
              width: particle.size,
              height: particle.size,
              opacity: particle.alpha,
              boxShadow: `0 0 ${particle.size * 3}px rgba(255,255,255,${particle.alpha * 0.6})`
            }}
          />
        ))}
      </div>

      {/* 底部神圣光晕 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 300px 400px at center, rgba(255,255,255,0.06) 0%, transparent 70%)'
        }}
        animate={{
          opacity: isGlowing ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 裂缝SVG - 大地纹理 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="100"
          height="220"
          viewBox="0 0 100 220"
          className="overflow-visible"
          style={{
            filter: isGlowing
              ? 'drop-shadow(0 0 15px rgba(255,255,255,0.4))'
              : 'drop-shadow(0 0 5px rgba(255,255,255,0.2))'
          }}
        >
          <defs>
            <filter id="riftGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur1"/>
              <feGaussianBlur stdDeviation="5" result="blur2"/>
              <feMerge>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* 上下渐变 - 顶部淡，中间亮，底部淡 */}
            <linearGradient id="crackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* 主裂缝：锯齿状大地纹理 */}
          <motion.path
            d="M50,10 L48,35 L55,55 L45,85 L52,120 L47,155 L53,190 L50,210"
            fill="none"
            stroke="url(#crackGradient)"
            strokeWidth={isGlowing ? 1.5 : 0.8}
            opacity={isGlowing ? 0.8 : 0.2}
            filter="url(#riftGlow)"
            animate={{
              opacity: isGlowing ? [0.8, 1, 0.8] : [0.2, 0.3, 0.2]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* 分支裂缝 1 */}
          <motion.path
            d="M48,35 L35,42 L25,38"
            fill="none"
            stroke="url(#crackGradient)"
            strokeWidth={isGlowing ? 0.8 : 0.5}
            opacity={isGlowing ? 0.5 : 0.1}
            filter="url(#riftGlow)"
            animate={{
              opacity: isGlowing ? [0.5, 0.7, 0.5] : [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />

          {/* 分支裂缝 2 */}
          <motion.path
            d="M45,85 L60,95 L75,90 L85,100"
            fill="none"
            stroke="url(#crackGradient)"
            strokeWidth={isGlowing ? 0.8 : 0.5}
            opacity={isGlowing ? 0.5 : 0.1}
            filter="url(#riftGlow)"
            animate={{
              opacity: isGlowing ? [0.5, 0.7, 0.5] : [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />

          {/* 分支裂缝 3 */}
          <motion.path
            d="M52,120 L35,135 L40,150"
            fill="none"
            stroke="url(#crackGradient)"
            strokeWidth={isGlowing ? 0.6 : 0.3}
            opacity={isGlowing ? 0.4 : 0.08}
            filter="url(#riftGlow)"
            animate={{
              opacity: isGlowing ? [0.4, 0.6, 0.4] : [0.08, 0.15, 0.08]
            }}
            transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />

          {/* 分支裂缝 4 */}
          <motion.path
            d="M47,155 L65,165 L60,180"
            fill="none"
            stroke="url(#crackGradient)"
            strokeWidth={isGlowing ? 0.7 : 0.4}
            opacity={isGlowing ? 0.45 : 0.09}
            filter="url(#riftGlow)"
            animate={{
              opacity: isGlowing ? [0.45, 0.65, 0.45] : [0.09, 0.18, 0.09]
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
        </svg>
      </div>

      {/* 裂缝内部的光束 */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '1px',
          height: isGlowing ? '90%' : '60%',
          background: 'linear-gradient(to bottom, transparent, white, transparent)',
          boxShadow: isGlowing ? '0 0 40px 5px white' : '0 0 15px white'
        }}
        animate={{
          opacity: isGlowing ? [0.9, 1, 0.9] : [0.2, 0.3, 0.2],
          height: isGlowing ? ['90%', '95%', '90%'] : ['60%', '65%', '60%']
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 文字提示 - 仅在鼠标悬停时显示（钻出时不显示） */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: (isHovered && !isDrillingOut) ? 1 : 0,
          scale: (isHovered && !isDrillingOut) ? 1 : 0.8
        }}
        transition={{ duration: 0.4 }}
      >
        <span
          className="text-xs tracking-[0.8em] text-white font-serif whitespace-nowrap"
          style={{
            textShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.4)',
            paddingLeft: '0.8em'
          }}
        >
          {text}
        </span>
      </motion.div>
    </div>
  );
};

interface PortfolioViewProps {
  onBack: () => void;
  userName?: string;
  nearbyFish?: FishPosition[];
  onVineNodesUpdate?: (nodes: VineNode[]) => void;
  onScrollProgressChange?: (progress: number, isFooterActive?: boolean, scrollDarkness?: number) => void;
  onCrackHoverChange?: (isHovered: boolean, position: { x: number; y: number } | null) => void;
  onDrillingStart?: (targetSection: string, crackPosition: { x: number; y: number }) => void;
  drillingTarget?: { section: string; position: { x: number; y: number } } | null;
  isDrillingOut?: boolean;
  // 手电筒相关
  flashlightActive?: boolean;
  flashlightPos?: { x: number; y: number } | null;
  onFlashlightPositionChange?: (position: { x: number; y: number } | null) => void;
  onFlashlightActiveChange?: (active: boolean) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ 
  onBack, 
  userName,
  nearbyFish = [],
  onVineNodesUpdate,
  onScrollProgressChange,
  onCrackHoverChange,
  onDrillingStart,
  drillingTarget,
  isDrillingOut = false,
  flashlightActive = false,
  flashlightPos = null,
  onFlashlightPositionChange,
  onFlashlightActiveChange
}) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [architectImageIndex, setArchitectImageIndex] = useState(0);
  const [activeNavItem, setActiveNavItem] = useState<number>(0);
  const [isFooterActive, setIsFooterActive] = useState<boolean>(false);
  const [isFishSectionVisible, setIsFishSectionVisible] = useState<boolean>(false);
  const [proximity, setProximity] = useState(0);
  const [scrollDarkness, setScrollDarkness] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const { playSwipeSound } = useAudio();

  // 藤蔓节点位置计算(用于鱼群吸引力场)
  const vineNodes = useMemo<VineNode[]>(() => {
    // 定义藤蔓关键节点位置(相对于侧边栏,左侧固定100px)
    // 这些位置对应三个导航项的y坐标
    return [
      { x: 100, y: 150, strength: 1.2 },  // 产品节点
      { x: 100, y: 320, strength: 1.2 },  // 架构师节点
      { x: 100, y: 490, strength: 1.2 },  // 用户节点
      // 添加一些中间节点增强吸引范围
      { x: 100, y: 80, strength: 0.6 },
      { x: 100, y: 235, strength: 0.6 },
      { x: 100, y: 405, strength: 0.6 },
      { x: 100, y: 560, strength: 0.6 }
    ];
  }, []);

  // 将藤蔓节点位置上报给父组件
  useEffect(() => {
    if (onVineNodesUpdate) {
      onVineNodesUpdate(vineNodes);
    }
  }, [vineNodes, onVineNodesUpdate]);

  // 动态路径计算:根据鱼群位置计算藤蔓的形变
  const dynamicVinePath = useMemo(() => {
    // 基础路径控制点
    const basePoints = [
      { x: 40, y: 20 },
      { cpx1: 60, cpy1: 120, cpx2: 20, cpy2: 220, x: 40, y: 320 },
      { cpx1: 60, cpy1: 420, cpx2: 20, cpy2: 520, x: 40, y: 580 }
    ];

    if (nearbyFish.length === 0) {
      // 没有鱼时返回基础路径
      return `M ${basePoints[0].x} ${basePoints[0].y} C ${basePoints[1].cpx1} ${basePoints[1].cpy1} ${basePoints[1].cpx2} ${basePoints[1].cpy2} ${basePoints[1].x} ${basePoints[1].y} C ${basePoints[2].cpx1} ${basePoints[2].cpy1} ${basePoints[2].cpx2} ${basePoints[2].cpy2} ${basePoints[2].x} ${basePoints[2].y}`;
    }

    // 计算鱼群对控制点的推力
    let offsetX1 = 0, offsetY1 = 0;
    let offsetX2 = 0, offsetY2 = 0;
    let offsetX3 = 0, offsetY3 = 0;
    let offsetX4 = 0, offsetY4 = 0;

    nearbyFish.forEach(fish => {
      // 对第一个贝塞尔曲线的两个控制点施加推力
      const dist1 = Math.hypot(fish.x - (basePoints[1].cpx1 + 60), fish.y - basePoints[1].cpy1);
      if (dist1 < 80) {
        const force = (80 - dist1) / 80 * 15;
        const angle = Math.atan2(fish.y - basePoints[1].cpy1, fish.x - (basePoints[1].cpx1 + 60));
        offsetX1 += Math.cos(angle) * force;
        offsetY1 += Math.sin(angle) * force;
      }

      const dist2 = Math.hypot(fish.x - (basePoints[1].cpx2 + 60), fish.y - basePoints[1].cpy2);
      if (dist2 < 80) {
        const force = (80 - dist2) / 80 * 15;
        const angle = Math.atan2(fish.y - basePoints[1].cpy2, fish.x - (basePoints[1].cpx2 + 60));
        offsetX2 += Math.cos(angle) * force;
        offsetY2 += Math.sin(angle) * force;
      }

      // 对第二个贝塞尔曲线的两个控制点施加推力
      const dist3 = Math.hypot(fish.x - (basePoints[2].cpx1 + 60), fish.y - basePoints[2].cpy1);
      if (dist3 < 80) {
        const force = (80 - dist3) / 80 * 15;
        const angle = Math.atan2(fish.y - basePoints[2].cpy1, fish.x - (basePoints[2].cpx1 + 60));
        offsetX3 += Math.cos(angle) * force;
        offsetY3 += Math.sin(angle) * force;
      }

      const dist4 = Math.hypot(fish.x - (basePoints[2].cpx2 + 60), fish.y - basePoints[2].cpy2);
      if (dist4 < 80) {
        const force = (80 - dist4) / 80 * 15;
        const angle = Math.atan2(fish.y - basePoints[2].cpy2, fish.x - (basePoints[2].cpx2 + 60));
        offsetX4 += Math.cos(angle) * force;
        offsetY4 += Math.sin(angle) * force;
      }
    });

    // 限制偏移量防止过度形变
    offsetX1 = Math.max(-20, Math.min(20, offsetX1));
    offsetY1 = Math.max(-20, Math.min(20, offsetY1));
    offsetX2 = Math.max(-20, Math.min(20, offsetX2));
    offsetY2 = Math.max(-20, Math.min(20, offsetY2));
    offsetX3 = Math.max(-20, Math.min(20, offsetX3));
    offsetY3 = Math.max(-20, Math.min(20, offsetY3));
    offsetX4 = Math.max(-20, Math.min(20, offsetX4));
    offsetY4 = Math.max(-20, Math.min(20, offsetY4));

    return `M ${basePoints[0].x} ${basePoints[0].y} C ${basePoints[1].cpx1 + offsetX1} ${basePoints[1].cpy1 + offsetY1} ${basePoints[1].cpx2 + offsetX2} ${basePoints[1].cpy2 + offsetY2} ${basePoints[1].x} ${basePoints[1].y} C ${basePoints[2].cpx1 + offsetX3} ${basePoints[2].cpy1 + offsetY3} ${basePoints[2].cpx2 + offsetX4} ${basePoints[2].cpy2 + offsetY4} ${basePoints[2].x} ${basePoints[2].y}`;
  }, [nearbyFish]);

  // Handle mouse proximity for sidebar interaction
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Calculate distance to the left sidebar area
      const sidebarX = 100; // Approx center of sidebar
      const dist = Math.abs(e.clientX - sidebarX);
      const intensity = Math.max(0, 1 - dist / 400); // Effect starts at 400px away
      setProximity(intensity);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const handleMouseEnter = () => {
    playSwipeSound('up', 0.5);
  };

  const { scrollYProgress } = useScroll({
    target: projectsRef,
    container: containerRef,
    offset: ["start center", "end center"]
  });

  // Play sound on scroll & update scroll progress
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollY = container.scrollTop;
    let timeoutId: any;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // 计算滚动进度 (0-1)
      const scrollProgress = scrollHeight > clientHeight 
        ? currentScrollY / (scrollHeight - clientHeight) 
        : 0;
      
      // 更新背景暗化程度
      setScrollDarkness(scrollProgress);
      
      // 通知父组件滚动进度变化（也传递 scrollDarkness）
      if (onScrollProgressChange) {
        onScrollProgressChange(scrollProgress, isFooterActive, scrollProgress);
      }
      
      // 音频反馈（节流）
      if (timeoutId) return;
      const diff = currentScrollY - lastScrollY;
      
      if (Math.abs(diff) > 50) {
        playSwipeSound(diff > 0 ? 'down' : 'up', Math.min(Math.abs(diff) / 100, 2));
        lastScrollY = currentScrollY;
        
        timeoutId = setTimeout(() => {
          timeoutId = null;
        }, 200); // Throttle
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [playSwipeSound, onScrollProgressChange, isFooterActive]);

  // Track active section for navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id === 'fish') setIsFishSectionVisible(true);
            else if (id === 'project-product') setActiveNavItem(0);
            else if (id === 'project-architect') setActiveNavItem(1);
            else if (id === 'project-user') setActiveNavItem(2);
            else if (id === 'footer') {
              setIsFooterActive(true);
              if (onScrollProgressChange) {
                const container = containerRef.current;
                if (container) {
                  const scrollProgress = container.scrollHeight > container.clientHeight
                    ? container.scrollTop / (container.scrollHeight - container.clientHeight)
                    : 0;
                  onScrollProgressChange(scrollProgress, true, scrollProgress);
                }
              }
            }
          } else {
            const id = entry.target.id;
            if (id === 'fish') setIsFishSectionVisible(false);
            else if (id === 'footer') {
              setIsFooterActive(false);
            }
          }
        });
      },
      { root: container, threshold: 0.3 }
    );

    const sections = ['fish', 'project-product', 'project-architect', 'project-user', 'footer'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [onScrollProgressChange]);

  const navItems = [
    { id: 'project-product', label: '产品', index: 0 },
    { id: 'project-architect', label: '架构师', index: 1 },
    { id: 'project-user', label: '用户', index: 2 },
  ];

  const scrollToSection = (id: string) => {
    playSwipeSound('down', 1.5);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 裂缝ref用于获取位置
  const bottomCrackRef = useRef<HTMLDivElement>(null);
  const topCrackRef = useRef<HTMLDivElement>(null);

  // 处理裂缝钻入效果
  const handleCrackEnter = (
    targetSection: string, 
    entranceCrackRef: React.RefObject<HTMLDivElement>,
    exitCrackRef: React.RefObject<HTMLDivElement>
  ) => {
    console.log('=== 裂缝点击 ===', targetSection);
    if (onDrillingStart && entranceCrackRef.current) {
      const rect = entranceCrackRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      console.log('触发钻入动画，位置:', { x: centerX, y: centerY });
      // 触发钻入动画（使用入口裂缝位置）
      onDrillingStart(targetSection, { x: centerX, y: centerY });
      
      // 延迟跳转，等待鱼群钻入
      setTimeout(() => {
        console.log('开始跳转到:', targetSection);
        scrollToSection(targetSection);
        
        // 跳转后再延迟，等待滚动和DOM更新，然后获取出口裂缝位置
        setTimeout(() => {
          if (exitCrackRef.current && onDrillingStart) {
            const exitRect = exitCrackRef.current.getBoundingClientRect();
            const exitX = exitRect.left + exitRect.width / 2;
            const exitY = exitRect.top + exitRect.height / 2;
            
            console.log('钻出位置:', { x: exitX, y: exitY });
            // 更新为出口位置，用于鱼群钻出
            onDrillingStart(targetSection, { x: exitX, y: exitY });
          }
        }, 300);
      }, 1500);
    } else {
      console.log('降级方案：直接跳转');
      // 降级方案：直接跳转
      scrollToSection(targetSection);
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-transparent text-white selection:bg-indigo-500/30 selection:text-white font-sans relative scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Fixed Sidebar Hidden - 使用滚动侧边栏代替 */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 2, delay: 1 }}
        className="fixed left-4 md:left-8 lg:left-16 top-1/2 -translate-y-1/2 z-40 hidden"
        style={{ display: 'none' }}
      >
        {/* Ethereal Halo Background */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-blue-400/5 blur-[100px] rounded-full -z-10"
        />

        {/* Glowing Divine Sea Vine SVG - Moonlight Theme */}
        <svg width="150" height="600" viewBox="0 0 150 600" className="absolute top-0 left-0 overflow-visible">
          <defs>
            {/* 增强发光滤镜 40% */}
            <filter id="divineGlow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="5" result="blur1"/>
              <feGaussianBlur stdDeviation="12" result="blur2"/>
              <feGaussianBlur stdDeviation="30" result="blur3"/>
              <feGaussianBlur stdDeviation="50" result="blur4"/>
              <feColorMatrix in="blur4" type="matrix" values="1 0 0 0 1  0 1 0 0 1  0 0 1 0 1  0 0 0 0.4 0" result="whiteGlow"/>
              <feMerge>
                <feMergeNode in="whiteGlow"/>
                <feMergeNode in="blur3"/>
                <feMergeNode in="blur2"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* 月光白色渐变 */}
            <linearGradient id="moonlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#FFFFFF', stopOpacity: 0.9}} /> 
              <stop offset="25%" style={{stopColor: '#E0F2FE', stopOpacity: 0.8}} /> 
              <stop offset="50%" style={{stopColor: '#F8FAFC', stopOpacity: 0.85}} /> 
              <stop offset="75%" style={{stopColor: '#CDD6E5', stopOpacity: 0.75}} />
              <stop offset="100%" style={{stopColor: '#FFFFFF', stopOpacity: 0.7}} />
            </linearGradient>
            
            {/* 次级发光色 */}
            <linearGradient id="subtleBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#BAE6FD', stopOpacity: 0.4}} />
              <stop offset="100%" style={{stopColor: '#7DD3FC', stopOpacity: 0.3}} />
            </linearGradient>
          </defs>
          
          <g>
            {/* Zen Flowing Light Background (The "Light Flow") - 月光色 */}
            <motion.path
              d="M 40 50 Q 70 150 40 300 Q 10 450 40 550"
              stroke="url(#moonlightGradient)"
              strokeWidth="14"
              fill="none"
              opacity="0.15"
              filter="blur(20px)"
              animate={{
                d: [
                  "M 40 50 Q 70 150 40 300 Q 10 450 40 550",
                  "M 40 50 Q 10 150 40 300 Q 70 450 40 550",
                  "M 40 50 Q 70 150 40 300 Q 10 450 40 550"
                ]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Main Seagrass-like Vine - 动态响应鱼群 */}
            <motion.path
              d={dynamicVinePath}
              stroke="url(#moonlightGradient)"
              strokeWidth="2.8"
              fill="none"
              filter="url(#divineGlow)"
              strokeLinecap="round"
              animate={{ d: dynamicVinePath }}
              transition={{ type: "spring", stiffness: 50, damping: 15, duration: 0.3 }}
            />

            {/* 分支藤蔓1: 从y=150处向右上延伸 */}
            <motion.path
              d="M 40 150 Q 70 120 95 110"
              stroke="url(#subtleBlue)"
              strokeWidth="1.8"
              fill="none"
              filter="url(#divineGlow)"
              strokeLinecap="round"
              opacity="0.6"
              animate={{
                d: [
                  "M 40 150 Q 70 120 95 110",
                  "M 40 150 Q 65 125 90 115",
                  "M 40 150 Q 70 120 95 110"
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />

            {/* 分支藤蔓2: 从y=320处向左下延伸 */}
            <motion.path
              d="M 40 320 Q 15 360 10 400"
              stroke="url(#subtleBlue)"
              strokeWidth="1.8"
              fill="none"
              filter="url(#divineGlow)"
              strokeLinecap="round"
              opacity="0.6"
              animate={{
                d: [
                  "M 40 320 Q 15 360 10 400",
                  "M 40 320 Q 20 355 15 395",
                  "M 40 320 Q 15 360 10 400"
                ]
              }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* 分支藤蔓3: 从y=480处向右下延伸 */}
            <motion.path
              d="M 40 480 Q 70 520 90 545"
              stroke="url(#subtleBlue)"
              strokeWidth="1.8"
              fill="none"
              filter="url(#divineGlow)"
              strokeLinecap="round"
              opacity="0.6"
              animate={{
                d: [
                  "M 40 480 Q 70 520 90 545",
                  "M 40 480 Q 65 515 85 540",
                  "M 40 480 Q 70 520 90 545"
                ]
              }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />

            {/* Secondary Ethereal Filament - 改为月光色 */}
            <motion.path
              d="M 45 40 C 35 140 55 240 45 340 C 35 440 55 540 45 570"
              stroke="#FFFFFF"
              strokeWidth="0.6"
              fill="none"
              opacity="0.25"
              animate={{
                d: [
                  "M 45 40 C 35 140 55 240 45 340 C 35 440 55 540 45 570",
                  "M 45 40 C 55 140 35 240 45 340 C 55 440 35 540 45 570",
                  "M 45 40 C 35 140 55 240 45 340 C 35 440 55 540 45 570"
                ]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* 能量球增强 - 6个不同大小和速度的月光能量球 */}
            <motion.circle r="3" fill="#FFFFFF" filter="url(#divineGlow)" opacity="0.9">
              <animateMotion dur="5s" repeatCount="indefinite" path={dynamicVinePath} />
            </motion.circle>
            
            <motion.circle r="2.2" fill="#E0F2FE" filter="url(#divineGlow)" opacity="0.8">
              <animateMotion dur="7s" begin="1.5s" repeatCount="indefinite" path={dynamicVinePath} />
            </motion.circle>

            <motion.circle r="1.8" fill="#FFFFFF" opacity="0.7">
              <animateMotion dur="11s" begin="3s" repeatCount="indefinite" path="M 45 40 C 35 140 55 240 45 340 C 35 440 55 540 45 570" />
            </motion.circle>

            <motion.circle r="1.5" fill="#BAE6FD" opacity="0.6">
              <animateMotion dur="9s" begin="2s" repeatCount="indefinite" path="M 40 150 Q 70 120 95 110" />
            </motion.circle>

            <motion.circle r="1.2" fill="#F8FAFC" opacity="0.6">
              <animateMotion dur="8s" begin="4s" repeatCount="indefinite" path="M 40 320 Q 15 360 10 400" />
            </motion.circle>

            <motion.circle r="1" fill="#FFFFFF" opacity="0.5">
              <animateMotion dur="10s" begin="5s" repeatCount="indefinite" path="M 40 480 Q 70 520 90 545" />
            </motion.circle>
          </g>
        </svg>

        {/* Navigation Items (The Zen Blooms) */}
        <div className="relative space-y-36 pl-10">
          {navItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="relative group cursor-pointer"
              onClick={() => scrollToSection(item.id)}
              onMouseEnter={handleMouseEnter}
            >
              <div className="relative flex items-center justify-center">
                {/* Interaction Aura (Reacts to fish/mouse) - 月光主题 */}
                <motion.div
                  className="absolute w-12 h-12 rounded-full"
                  whileHover={{ scale: 1.5, opacity: 0.4 }}
                  animate={activeNavItem === index ? {
                    scale: [1, 2, 1],
                    opacity: [0.05, 0.25, 0.05],
                    background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(224,242,254,0.1) 70%, transparent 100%)'
                  } : {}}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* The Bloom Core - 月光白色 */}
                <motion.div
                  className={`w-4 h-4 rounded-full relative z-10 flex items-center justify-center transition-all duration-[2000ms] ${
                    activeNavItem === index
                      ? 'shadow-[0_0_40px_rgba(255,255,255,0.95),0_0_20px_rgba(224,242,254,0.6)] scale-110'
                      : 'opacity-40 group-hover:opacity-100 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]'
                  }`}
                  style={{
                    background: activeNavItem === index 
                      ? 'radial-gradient(circle, #FFFFFF 0%, #E0F2FE 40%, #BAE6FD 100%)' 
                      : 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(224,242,254,0.4) 100%)',
                    filter: 'blur(0.5px)'
                  }}
                >
                  {/* Subtle pulsing spark */}
                  <motion.div 
                    className="w-full h-full rounded-full bg-white/40 blur-[2px]"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
              </div>
              
              {/* Label */}
              <motion.div
                className={`absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none transition-all duration-[1500ms] ${
                  activeNavItem === index ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-[12px] tracking-[0.6em] font-light transition-colors duration-1000 ${
                    activeNavItem === index ? 'text-white' : 'text-white/30 group-hover:text-white/70'
                  }`}
                  style={{
                    textShadow: activeNavItem === index ? '0 0 25px rgba(255,255,255,0.6), 0 0 12px rgba(224,242,254,0.4)' : 'none'
                  }}>
                    {item.label}
                  </span>
                  {activeNavItem === index && (
                    <motion.div 
                      layoutId="active-nav-underline"
                      className="h-px w-full bg-gradient-to-r from-white/40 to-transparent mt-2" 
                    />
                  )}
                </div>
              </motion.div>

              {/* Zen Particles (Falling Dust) */}
              <AnimatePresence>
                {activeNavItem === index && [...Array(3)].map((_, i) => (
                  <motion.div
                    key={`zen-dust-${i}`}
                    initial={{ opacity: 0, y: -20, x: (Math.random() - 0.5) * 20 }}
                    animate={{ 
                      opacity: [0, 0.6, 0], 
                      y: 40,
                      x: (Math.random() - 0.5) * 40
                    }}
                    transition={{ 
                      duration: 5 + Math.random() * 3, 
                      repeat: Infinity,
                      delay: i * 1.5,
                      ease: "linear"
                    }}
                    className="absolute left-2 top-2 w-[1px] h-[1px] bg-white rounded-full shadow-[0_0_8px_white]"
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Scroll-based Dynamic Darkening Overlay (Deep Sea Descent) */}
      <div 
        className="fixed inset-0 pointer-events-none z-[6]"
        style={{ 
          backgroundColor: `rgba(2, 6, 23, ${scrollDarkness * 0.6})`,
          transition: 'background-color 0.5s ease-out'
        }} 
      />

      {/* Global Ethereal Atmosphere (Deep Sea Vibe) */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827]/20 via-[#0B101E]/10 to-transparent" />
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/5 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-900/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 md:px-16 py-8 flex justify-between items-center bg-gradient-to-b from-[#0F172A]/80 to-transparent backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 cursor-pointer group z-50 relative"
          onClick={onBack}
        >
          {/* Monument Valley Diamond Motif */}
          <div className="relative w-8 h-8 flex items-center justify-center rotate-45 transition-transform duration-1000 group-hover:rotate-90">
            <div className="absolute inset-0 border border-white/30" />
            <div className="w-3 h-3 bg-white/30 group-hover:bg-white/90 transition-colors duration-700 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          </div>
          <span className="text-[10px] font-light tracking-[0.8em] uppercase text-white/70 font-sans group-hover:text-white transition-colors duration-700">
            Journey
          </span>
        </motion.div>

        <div className="hidden md:flex items-center space-x-12">
          <button 
            onClick={() => scrollToSection('light')}
            onMouseEnter={handleMouseEnter}
            className="text-[10px] tracking-[0.6em] uppercase text-white/60 hover:text-white transition-all duration-700 font-sans relative group"
          >
            要有光
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-px bg-white/70 group-hover:w-full transition-all duration-500" />
          </button>
          <button 
            onClick={() => scrollToSection('fish')}
            onMouseEnter={handleMouseEnter}
            className="text-[10px] tracking-[0.6em] uppercase text-white/60 hover:text-white transition-all duration-700 font-sans relative group"
          >
            寻找鱼
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-px bg-white/70 group-hover:w-full transition-all duration-500" />
          </button>
        </div>

        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onBack}
          onMouseEnter={handleMouseEnter}
          className="text-[9px] tracking-[0.6em] uppercase text-white/55 hover:text-white transition-all duration-700 flex items-center group font-sans"
        >
          <span className="mr-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700">←</span>
          Return
        </motion.button>
      </nav>



      {/* Hero Section - The Threshold */}
      <section id="deep-sea" className="relative h-screen flex flex-col justify-center items-center px-8 overflow-hidden z-10 snap-start">
        
        {/* Floating Monument Elements */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div 
            animate={{ y: [-20, 20, -20], rotate: [0, 5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] border border-white/5 rotate-45 absolute opacity-30"
          />
          <motion.div 
            animate={{ y: [20, -20, 20], rotate: [45, 40, 45] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="w-[30vw] h-[30vw] max-w-[450px] max-h-[450px] border border-white/10 rotate-45 absolute opacity-20"
          />
        </div>

        <div className="relative z-20 text-center space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center space-y-6">
              <motion.div 
                animate={{ height: [0, 40, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-px bg-gradient-to-b from-transparent via-white/50 to-transparent" 
              />
              <span className="text-white/40 text-[10px] md:text-xs font-mono tracking-[1em] md:tracking-[1.5em] uppercase block whitespace-nowrap">A W A K E N I N G &nbsp;/&nbsp; 觉 醒</span>
            </div>
            
            <motion.h1 
              animate={{
                textShadow: [
                  "0 0 15px rgba(186, 230, 253, 0.2), 0 0 30px rgba(56, 189, 248, 0.1)",
                  "0 0 25px rgba(186, 230, 253, 0.4), 0 0 50px rgba(56, 189, 248, 0.2), 0 0 70px rgba(2, 132, 199, 0.15)",
                  "0 0 15px rgba(186, 230, 253, 0.2), 0 0 30px rgba(56, 189, 248, 0.1)"
                ]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl md:text-7xl lg:text-[7rem] font-light tracking-widest leading-none text-sky-50 font-serif relative"
            >
              深海之光
              <div className="absolute inset-0 bg-blue-400/10 blur-[60px] -z-10 rounded-full" />
            </motion.h1>
            
            <p className="text-white/40 text-[10px] md:text-xs tracking-[0.8em] md:tracking-[1.2em] uppercase font-light mt-12 font-sans whitespace-nowrap">
              L I G H T &nbsp; W I T H I N &nbsp; T H E &nbsp; S I L E N C E &nbsp;/&nbsp; 寂 静 中 的 光
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 2.5 }}
            className="flex flex-col items-center space-y-12"
          >
            <p className="max-w-2xl text-white/50 font-light leading-[2.5] tracking-[0.15em] text-sm md:text-base px-8 font-serif italic">
              在绝对的静谧中，光是唯一的秩序。
              <br />
              穿透深渊，去捕捉那些被时间遗忘的灵性。
            </p>
          </motion.div>
        </div>

        {/* 海底裂缝 - 光遇神圣风格入口 */}
        <AbyssalCrack 
          onEnter={() => handleCrackEnter('light', bottomCrackRef, topCrackRef)}
          onHoverChange={onCrackHoverChange}
          crackRef={bottomCrackRef}
          isDrillingOut={isDrillingOut && drillingTarget?.section === 'deep-sea'}
        />
      </section>

      {/* Section 1: 要有光 (Let there be Light) */}
      <section id="light" className="py-48 md:py-64 px-8 md:px-24 lg:px-48 relative z-10 snap-start">
        {/* 回光裂缝 - 顶部入口 */}
        <AbyssalCrack 
          text="回光"
          position="top"
          onEnter={() => handleCrackEnter('deep-sea', topCrackRef, bottomCrackRef)}
          onHoverChange={onCrackHoverChange}
          crackRef={topCrackRef}
          isDrillingOut={isDrillingOut && drillingTarget?.section === 'light'}
        />
        
        {/* Section Header */}
        <div className="relative mb-[80vh] flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            onViewportEnter={() => {
              // 进入"要有光"章节，激活手电筒
              onFlashlightActiveChange?.(true);
            }}
            onViewportLeave={() => {
              // 离开章节，停用手电筒
              onFlashlightActiveChange?.(false);
            }}
            className="space-y-8 relative"
          >
            {/* Ethereal Glow - 青绿色浮游生物光晕 */}
            <div className="absolute inset-0 bg-gradient-radial from-teal-400/10 via-cyan-400/5 to-transparent blur-[80px] rounded-full -z-10" />
            
            {/* 手电筒揭示效果 */}
            <FlashlightOverlay 
              isActive={flashlightActive}
              onPositionChange={onFlashlightPositionChange}
              lightRadius={135}
            >
              <div className="space-y-8">
                <span className="bioluminescent-text text-teal-200 text-[10px] font-serif tracking-[1.2em] uppercase font-light" style={{fontFamily: '"Cormorant Garamond", serif'}}>Chapter I</span>
                <h2 className="text-6xl md:text-8xl font-extralight tracking-tight text-white font-serif drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">要有光</h2>
                <p className="bioluminescent-text text-cyan-100 text-[10px] tracking-[0.8em] uppercase font-light" style={{fontFamily: '"Cormorant Garamond", serif'}}>Let there be Light</p>
              </div>
            </FlashlightOverlay>
            
            {/* 向下倒三角指示器 + 拨转文字 - 始终可见，不受手电筒影响 */}
            <div className="mt-48 md:mt-56 lg:mt-64 flex justify-center">
              <RotationIndicator />
            </div>
          </motion.div>
          

        </div>

        {/* Projects Stack - 带有滚动藤蔓侧边栏 */}
        <div ref={projectsRef} className="space-y-48 md:space-y-64 relative ml-0 md:ml-16 lg:ml-24">
          
          {/* 滚动藤蔓侧边栏 - 从产品到用户，嵌入在内容中随滚动移动 */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute left-[-100px] md:left-[-140px] lg:left-[-200px] xl:left-[-220px] top-0 z-30 hidden lg:block"
            style={{ height: '100%', minHeight: '2500px' }}
          >
            {/* Ethereal Halo Background */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 top-1/3 w-32 h-96 bg-blue-400/10 blur-[100px] rounded-full -z-10"
            />

            {/* Glowing Divine Sea Vine SVG - Moonlight Theme */}
            <svg width="150" height="100%" viewBox="0 0 150 2000" preserveAspectRatio="xMidYMin meet" className="absolute top-0 left-0 overflow-visible" style={{ height: '100%', minHeight: '2000px' }}>
              <defs>
                {/* 增强发光滤镜 40% */}
                <filter id="divineGlowScroll" x="-150%" y="-150%" width="400%" height="400%">
                  <feGaussianBlur stdDeviation="5" result="blur1"/>
                  <feGaussianBlur stdDeviation="12" result="blur2"/>
                  <feGaussianBlur stdDeviation="30" result="blur3"/>
                  <feGaussianBlur stdDeviation="50" result="blur4"/>
                  <feColorMatrix in="blur4" type="matrix" values="1 0 0 0 1  0 1 0 0 1  0 0 1 0 1  0 0 0 0.4 0" result="whiteGlow"/>
                  <feMerge>
                    <feMergeNode in="whiteGlow"/>
                    <feMergeNode in="blur3"/>
                    <feMergeNode in="blur2"/>
                    <feMergeNode in="blur1"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* 月光白色渐变 */}
                <linearGradient id="moonlightGradientScroll" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#FFFFFF', stopOpacity: 0.9}} /> 
                  <stop offset="25%" style={{stopColor: '#E0F2FE', stopOpacity: 0.8}} /> 
                  <stop offset="50%" style={{stopColor: '#F8FAFC', stopOpacity: 0.85}} /> 
                  <stop offset="75%" style={{stopColor: '#CDD6E5', stopOpacity: 0.75}} />
                  <stop offset="100%" style={{stopColor: '#FFFFFF', stopOpacity: 0.7}} />
                </linearGradient>
                
                {/* 次级发光色 */}
                <linearGradient id="subtleBlueScroll" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#BAE6FD', stopOpacity: 0.4}} />
                  <stop offset="100%" style={{stopColor: '#7DD3FC', stopOpacity: 0.3}} />
                </linearGradient>
              </defs>
              
              <g>
                {/* Main Seagrass-like Vine - 动态响应鱼群,贯穿三个section */}
                <motion.path
                  d="M 40 100 C 60 400 20 700 40 1000 C 60 1300 20 1600 40 1900"
                  stroke="url(#moonlightGradientScroll)"
                  strokeWidth="3"
                  fill="none"
                  filter="url(#divineGlowScroll)"
                  strokeLinecap="round"
                  animate={{
                    d: [
                      "M 40 100 C 60 400 20 700 40 1000 C 60 1300 20 1600 40 1900",
                      "M 40 100 C 20 400 60 700 40 1000 C 20 1300 60 1600 40 1900",
                      "M 40 100 C 60 400 20 700 40 1000 C 60 1300 20 1600 40 1900"
                    ]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* 分支藤蔓 - 对应三个section */}
                <motion.path
                  d="M 40 400 Q 75 350 100 320"
                  stroke="url(#subtleBlueScroll)"
                  strokeWidth="2"
                  fill="none"
                  filter="url(#divineGlowScroll)"
                  strokeLinecap="round"
                  opacity="0.6"
                  animate={{
                    d: [
                      "M 40 400 Q 75 350 100 320",
                      "M 40 400 Q 70 355 95 325",
                      "M 40 400 Q 75 350 100 320"
                    ]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                <motion.path
                  d="M 40 1000 Q 10 1060 5 1120"
                  stroke="url(#subtleBlueScroll)"
                  strokeWidth="2"
                  fill="none"
                  filter="url(#divineGlowScroll)"
                  strokeLinecap="round"
                  opacity="0.6"
                  animate={{
                    d: [
                      "M 40 1000 Q 10 1060 5 1120",
                      "M 40 1000 Q 15 1055 10 1115",
                      "M 40 1000 Q 10 1060 5 1120"
                    ]
                  }}
                  transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                <motion.path
                  d="M 40 1600 Q 75 1680 100 1740"
                  stroke="url(#subtleBlueScroll)"
                  strokeWidth="2"
                  fill="none"
                  filter="url(#divineGlowScroll)"
                  strokeLinecap="round"
                  opacity="0.6"
                  animate={{
                    d: [
                      "M 40 1600 Q 75 1680 100 1740",
                      "M 40 1600 Q 70 1675 95 1735",
                      "M 40 1600 Q 75 1680 100 1740"
                    ]
                  }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                />

                {/* Secondary Ethereal Filament */}
                <motion.path
                  d="M 45 150 C 35 450 55 750 45 1050 C 35 1350 55 1650 45 1850"
                  stroke="#FFFFFF"
                  strokeWidth="0.7"
                  fill="none"
                  opacity="0.25"
                  animate={{
                    d: [
                      "M 45 150 C 35 450 55 750 45 1050 C 35 1350 55 1650 45 1850",
                      "M 45 150 C 55 450 35 750 45 1050 C 55 1350 35 1650 45 1850",
                      "M 45 150 C 35 450 55 750 45 1050 C 35 1350 55 1650 45 1850"
                    ]
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                {/* 能量球 - 沿着藤蔓滑行的光点 */}
                <motion.circle r="3.5" fill="#FFFFFF" filter="url(#divineGlowScroll)" opacity="0.9">
                  <animateMotion dur="8s" repeatCount="indefinite" path="M 40 100 C 60 400 20 700 40 1000 C 60 1300 20 1600 40 1900" />
                </motion.circle>
                
                <motion.circle r="2.5" fill="#E0F2FE" filter="url(#divineGlowScroll)" opacity="0.8">
                  <animateMotion dur="11s" begin="2s" repeatCount="indefinite" path="M 40 100 C 60 400 20 700 40 1000 C 60 1300 20 1600 40 1900" />
                </motion.circle>

                <motion.circle r="2" fill="#FFFFFF" opacity="0.7">
                  <animateMotion dur="14s" begin="4s" repeatCount="indefinite" path="M 45 150 C 35 450 55 750 45 1050 C 35 1350 55 1650 45 1850" />
                </motion.circle>

                <motion.circle r="1.8" fill="#BAE6FD" opacity="0.6">
                  <animateMotion dur="6s" begin="1s" repeatCount="indefinite" path="M 40 400 Q 75 350 100 320" />
                </motion.circle>

                <motion.circle r="1.5" fill="#F8FAFC" opacity="0.6">
                  <animateMotion dur="7s" begin="3s" repeatCount="indefinite" path="M 40 1000 Q 10 1060 5 1120" />
                </motion.circle>

                <motion.circle r="1.3" fill="#FFFFFF" opacity="0.5">
                  <animateMotion dur="6.5s" begin="5s" repeatCount="indefinite" path="M 40 1600 Q 75 1680 100 1740" />
                </motion.circle>
              </g>
            </svg>

            {/* Navigation Items (The Zen Blooms) - 对应三个section的位置 */}
            <div className="absolute left-0 top-0 w-full h-full pointer-events-auto">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="absolute group cursor-pointer"
                  style={{
                    top: index === 0 ? '20%' : index === 1 ? '50%' : '80%',
                    left: '10px'
                  }}
                  onClick={() => scrollToSection(item.id)}
                  onMouseEnter={handleMouseEnter}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 1 + index * 0.3 }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Interaction Aura */}
                    <motion.div
                      className="absolute w-16 h-16 rounded-full"
                      whileHover={{ scale: 1.4, opacity: 0.5 }}
                      animate={activeNavItem === index ? {
                        scale: [1, 2.2, 1],
                        opacity: [0.05, 0.3, 0.05],
                        background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(224,242,254,0.15) 70%, transparent 100%)'
                      } : {}}
                      transition={{ duration: 4, repeat: Infinity }}
                    />

                    {/* The Bloom Core */}
                    <motion.div
                      className={`w-5 h-5 rounded-full relative z-10 flex items-center justify-center transition-all duration-[2000ms] ${
                        activeNavItem === index
                          ? 'shadow-[0_0_45px_rgba(255,255,255,1),0_0_25px_rgba(224,242,254,0.7)] scale-125'
                          : 'opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.7)]'
                      }`}
                      style={{
                        background: activeNavItem === index 
                          ? 'radial-gradient(circle, #FFFFFF 0%, #E0F2FE 40%, #BAE6FD 100%)' 
                          : 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(224,242,254,0.5) 100%)',
                        filter: 'blur(0.3px)'
                      }}
                    >
                      <motion.div 
                        className="w-full h-full rounded-full bg-white/50 blur-[2px]"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                  
                  {/* Label */}
                  <motion.div
                    className={`absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none transition-all duration-[1500ms] ${
                      activeNavItem === index ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0'
                    }`}
                  >
                    <span className={`text-[13px] tracking-[0.7em] font-light transition-colors duration-1000 ${
                      activeNavItem === index ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                    }`}
                    style={{
                      textShadow: activeNavItem === index ? '0 0 30px rgba(255,255,255,0.7), 0 0 15px rgba(224,242,254,0.5)' : 'none'
                    }}>
                      {item.label}
                    </span>
                    {activeNavItem === index && (
                      <motion.div 
                        layoutId="active-nav-underline-scroll"
                        className="h-px w-full bg-gradient-to-r from-white/50 to-transparent mt-3" 
                      />
                    )}
                  </motion.div>

                  {/* Zen Particles */}
                  <AnimatePresence>
                    {activeNavItem === index && [...Array(4)].map((_, i) => (
                      <motion.div
                        key={`zen-particle-${i}`}
                        initial={{ opacity: 0, y: -15, x: (Math.random() - 0.5) * 25 }}
                        animate={{ 
                          opacity: [0, 0.8, 0], 
                          y: 50,
                          x: (Math.random() - 0.5) * 50
                        }}
                        transition={{ 
                          duration: 6 + Math.random() * 4, 
                          repeat: Infinity,
                          delay: i * 1.8,
                          ease: "linear"
                        }}
                        className="absolute left-2 top-2 w-[1.5px] h-[1.5px] bg-white rounded-full shadow-[0_0_10px_white]"
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>


          {/* Project 1: 产品 */}
          <div className="relative">
            <div id="project-product" className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center scroll-mt-32 md:scroll-mt-48 snap-start">
              <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-12"
            >
              <div className="space-y-6">
                <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">01 / Product</span>
                <h3 className="text-4xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">产品: <br />为什么而生?</h3>
              </div>
              <div className="text-white/50 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif italic space-y-4">
                <p className="text-indigo-300 font-medium not-italic">管报中台系统自动化0-1设计：从“解耦”到“重构”</p>
                <p>这不仅是一套自动化管报系统，更是一场生产关系的重构。</p>
                <p>我被编程语言“解耦”的奥义启发，通过人本位的区域分割，将复杂的非标准建模转化为系统的秩序。</p>
                <p>自动化从来不是终点，而是释放创造力的手段：<br/>让 IT 沉淀可复用的逻辑资产，让财务回归商业实质的深度洞察。</p>
                <p>当繁琐归于算法，人的注意力，才会被引向更有价值的远方。</p>
              </div>
              <div className="pt-8">
                <EtherealExploreButton onClick={() => setActiveProject('product')} />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8 }}
              viewport={{ once: true }}
              className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
              style={{
                cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
              }}
            >
              {/* 底部发光效果 */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
              <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />
              
              <img 
                src="https://raw.githubusercontent.com/zhong215/Web/main/ETL%20Process%20for%20BIP%20Data-2026-02-24-092903.svg" 
                alt="Product" 
                onClick={() => {
                  setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/ETL%20Process%20for%20BIP%20Data-2026-02-24-092903.svg");
                  setScale(1);
                }}
                className="w-full h-full object-contain opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              {/* Floating Fish - Sky Style */}
              <motion.div 
                animate={{ 
                  y: [0, -30, 0],
                  x: [0, 20, 0],
                  opacity: [0.2, 0.6, 0.2]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 right-1/4 pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              >
                <Fish size={32} className="text-white/80 rotate-12" />
              </motion.div>
            </motion.div>
            </div>
          </div>

          {/* Project 2: 架构师 */}
          <div className="relative">
            <div id="project-architect" className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center scroll-mt-32 md:scroll-mt-48 snap-start">
              <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8 }}
              viewport={{ once: true }}
              className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700 order-2 lg:order-1"
              style={{
                cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
              }}
            >
              {/* 底部发光效果 */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
              <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />
              
              <img 
                src="https://raw.githubusercontent.com/zhong215/Web/main/AI%20workflow.svg" 
                alt="Architect" 
                onClick={() => {
                  setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/AI%20workflow.svg");
                  setScale(1);
                }}
                className="w-full h-full object-contain opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <motion.div 
                animate={{ 
                  y: [30, 0, 30],
                  x: [-20, 0, -20],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-1/4 left-1/4 pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              >
                <Fish size={40} className="text-white/80 -rotate-12" />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-12 order-1 lg:order-2"
            >
              <div className="space-y-6">
                <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">02 / Architect</span>
                <h3 className="text-4xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">架构师: <br />我是谁? 去哪里?</h3>
              </div>
              <div className="text-white/50 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif italic space-y-4">
                <p className="text-indigo-300 font-medium not-italic">管理分析AI系统原型验证</p>
                <p>我被图灵机的底层逻辑与“减法”奥义启发，将复杂的财务分析拆解为层层过滤的信息提取，在数据洪流中构建秩序。</p>
                <p>极致减法从来不是缺失，而是对精确注意力的尊重。</p>
                <p>通过RAG架构与提示词工程，将浩瀚的数据归拢为精确的秩序。</p>
                <p>当信息归于极简，决策的智慧，才会在精准的留白中涌现。</p>
              </div>
              <div className="pt-8">
                <EtherealExploreButton onClick={() => setActiveProject('architect')} />
              </div>
            </motion.div>
            </div>
          </div>

          {/* Project 3: 用户 */}
          <div className="relative">
            <div id="project-user" className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center scroll-mt-32 md:scroll-mt-48 snap-start">
              <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-12"
            >
              <div className="space-y-6">
                <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">03 / User</span>
                <h3 className="text-4xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">用户: <br />什么是美?</h3>
              </div>
              <div className="text-white/50 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif italic space-y-4">
                <p className="text-indigo-300 font-medium not-italic">财务数字化培训</p>
                <p>美，是冗余消散后的秩序。</p>
                <p>技术如何与人融合，归根结底是如何发展人的问题。</p>
                <p>技术的审美不在于功能的堆砌，而在于如何共创，如何解除人的枷锁，完成人的进化。</p>
              </div>
              <div className="pt-8">
                <EtherealExploreButton onClick={() => setActiveProject('user')} />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -8 }}
              viewport={{ once: true }}
              className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.02] to-transparent rounded-[3rem] group overflow-visible border border-white/5 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
              style={{
                cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
              }}
            >
              {/* 底部发光效果 */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
              <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />
              
              <img 
                src="https://raw.githubusercontent.com/zhong215/Web/main/%E4%B8%BB%E9%A1%B5PPT.png" 
                alt="Beauty" 
                onClick={() => {
                  setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/%E4%B8%BB%E9%A1%B5PPT.png");
                  setScale(1);
                }}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10 rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 寻找鱼 (Finding the Fish) */}
      <section id="fish" className="py-48 md:py-64 px-8 md:px-24 lg:px-48 relative z-10 snap-start overflow-hidden">
        {/* Section Header */}
        <div className="relative mb-48 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8 relative"
          >
            <div className="absolute inset-0 bg-teal-500/10 blur-[80px] rounded-full -z-10" />
            
            <span className="text-teal-300/50 text-[10px] font-mono tracking-[1.2em] uppercase">Chapter II</span>
            <h2 className="text-6xl md:text-8xl font-extralight tracking-tight text-white font-serif drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">寻找鱼</h2>
            <p className="text-white/30 text-[10px] tracking-[0.8em] uppercase font-light font-sans">Finding the Fish</p>
          </motion.div>
          <div className="mt-24 w-px h-32 bg-gradient-to-b from-teal-500/30 to-transparent" />
          
          {/* 鲸鱼音效按钮 */}
          <div className="-mt-18">
            <WhaleCallButton onUnlock={() => scrollToSection('fish-intro')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 lg:gap-48 items-center relative">
          <div className="space-y-12 relative">
            <div className="space-y-8 text-white/50 font-light leading-[2.4] text-base md:text-lg tracking-wide max-w-xl font-serif italic">
              <p id="fish-intro" className="text-2xl text-white/80 not-italic font-sans mb-12" style={{ scrollMarginTop: '120px' }}>
                很高兴遇见你! {userName || '朋友'}
              </p>
              <p>
                我是一名跨学科的产品设计师。
              </p>
              <p>
                我喜欢，且享受像鱼一样感知流动的世界，捕捉深处隐藏的不变的秩序。
              </p>
              <p>
                我相信万物之美，殊途同归。
              </p>
              <p>
                文学启示我"世界上没有什么微不足道"，程序语言告诉我实现目的需要学会建立清晰的边界。
              </p>
              <p>
                无论是构建严谨得财务自动化系统，还是对交互体验的斟酌， 我始终在寻找那个让技术与人文契合的“光”。
              </p>
            </div>
            {/* BubbleButton - 联系按钮（移动端） */}
            <div className="mt-16 flex justify-center md:hidden">
              <BubbleButton 
                horizontalDirection="left"
                verticalOffset={24}
                horizontalOffset={24}
                onClick={() => {
                  const contactSection = document.getElementById('footer');
                  contactSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </div>

          {/* BubbleButton - 中间悬浮（平板/桌面） */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
            <BubbleButton
              horizontalDirection="left"
              verticalOffset={400}
              horizontalOffset={70}
              onClick={() => {
                const contactSection = document.getElementById('footer');
                contactSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-[3/4] w-full max-w-md rounded-[2rem] overflow-hidden bg-white/[0.02] border border-white/10 backdrop-blur-sm shadow-[0_0_60px_rgba(0,0,0,0.4)]"
            >
              <img 
                src="https://raw.githubusercontent.com/zhong215/Web/main/%E4%B8%AA%E4%BA%BA%E7%85%A7%E7%89%87.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-[4s]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-60 pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="py-32 md:py-48 px-8 md:px-24 lg:px-48 relative z-10 border-t border-white/5 snap-start min-h-screen">
        {/* 竖排文字布局 */}
        <div className="relative h-full flex items-center justify-center md:justify-end md:pr-[10%] lg:pr-[15%]">
          {/* 竖排标题组 */}
          <div className="flex flex-row-reverse items-start gap-12 md:gap-20 lg:gap-24">
            
            <VerticalText 
              text="行至深处" 
              className="text-3xl md:text-4xl lg:text-5xl font-thin text-white/80 serif"
              charDelay={400}
            />

            <VerticalText 
              text="万象俱寂" 
              className="text-3xl md:text-4xl lg:text-5xl font-thin text-white/30 serif mt-24 md:mt-32 lg:mt-48"
              charDelay={1000}
            />

            {/* 装饰引线 */}
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '18rem', opacity: 1 }}
              transition={{ duration: 5, delay: 0.7 }}
              className="w-[0.5px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"
            />
          </div>
        </div>
        
        {/* 联系信息：左下角落款 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, delay: 2 }}
          className="absolute bottom-12 left-12 md:bottom-20 md:left-20 lg:left-24 z-20"
        >
          <div className="space-y-10">
            {/* 英文标语 */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.4 }}
              className="flex flex-col gap-1"
            >
              <motion.div 
                className="text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.7em] text-cyan-200 uppercase font-light"
                style={{
                  textShadow: '0 0 4px rgba(34, 211, 238, 1), 0 0 8px rgba(34, 211, 238, 0.9), 0 0 12px rgba(34, 211, 238, 0.8), 0 0 16px rgba(34, 211, 238, 0.6), 0 0 24px rgba(34, 211, 238, 0.4)',
                  filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.9)) drop-shadow(0 0 13px rgba(34, 211, 238, 0.6))',
                }}
                animate={{
                  textShadow: [
                    '0 0 4px rgba(34, 211, 238, 1), 0 0 8px rgba(34, 211, 238, 0.9), 0 0 12px rgba(34, 211, 238, 0.8), 0 0 16px rgba(34, 211, 238, 0.6), 0 0 24px rgba(34, 211, 238, 0.4)',
                    '0 0 6px rgba(34, 211, 238, 1), 0 0 12px rgba(34, 211, 238, 1), 0 0 18px rgba(34, 211, 238, 0.9), 0 0 24px rgba(34, 211, 238, 0.8), 0 0 32px rgba(34, 211, 238, 0.6)',
                    '0 0 4px rgba(34, 211, 238, 1), 0 0 8px rgba(34, 211, 238, 0.9), 0 0 12px rgba(34, 211, 238, 0.8), 0 0 16px rgba(34, 211, 238, 0.6), 0 0 24px rgba(34, 211, 238, 0.4)'
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Defining the next rhythm of order
              </motion.div>
              <div className="h-px w-12 bg-cyan-500/20 mt-2"></div>
            </motion.div>

            {/* 联系方式列表 */}
            <div className="flex flex-col gap-6">
              {[
                { label: "Wechat", value: "NANA2001215", icon: MessageCircle },
                { label: "Phone", value: "19230757804", icon: Phone },
                { label: "Email", value: "zlh2001215@163.com", icon: Mail }
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 2.6 + idx * 0.2 }}
                    className="group cursor-default flex items-center gap-4"
                  >
                    <div className="text-cyan-500/20 group-hover:text-cyan-400 transition-colors duration-500">
                      <IconComponent size={14} />
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-600 tracking-widest uppercase mb-0.5 group-hover:text-cyan-500/50 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-xs md:text-sm font-sans tracking-[0.2em] text-slate-400 group-hover:text-slate-100 transition-colors">
                        {item.value}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
        
        {/* 底部版权信息 */}
        <div className="absolute bottom-8 left-0 right-0 px-12 md:px-20 lg:px-24">
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[8px] tracking-[0.8em] text-white/20 uppercase font-light font-sans">
            <p>© 2025 Order of the Deep. All Rights Reserved.</p>
            <div className="flex space-x-12 mt-8 md:mt-0">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-white cursor-pointer transition-colors">Archive</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Case Study Overlay */}
      <AnimatePresence>
        {(activeProject === 'product' || activeProject === 'product-2' || activeProject === 'architect' || activeProject === 'architect-2' || activeProject === 'user' || activeProject === 'user-2') && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[80] bg-[#0F172A] overflow-y-auto"
          >
            {/* Navigation for Overlay */}
            <nav className="sticky top-0 left-0 w-full z-50 px-8 md:px-16 py-8 flex justify-between items-center bg-gradient-to-b from-[#0F172A]/90 to-transparent backdrop-blur-md">
              <button 
                onClick={() => {
                  if (activeProject === 'product-2') setActiveProject('product');
                  else if (activeProject === 'architect-2') setActiveProject('architect');
                  else if (activeProject === 'user-2') setActiveProject('user');
                  else setActiveProject(null);
                }}
                className="text-[9px] tracking-[0.6em] uppercase text-white/50 hover:text-white transition-all duration-700 flex items-center group font-sans"
              >
                <span className="mr-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700">←</span>
                {(activeProject === 'product-2' || activeProject === 'architect-2' || activeProject === 'user-2') ? 'Back to Previous' : 'Return to Journey'}
              </button>
            </nav>

            <div className="min-h-screen px-8 md:px-24 lg:px-48 pt-24 pb-48 flex flex-col justify-center relative">
              <AnimatePresence mode="wait">
                {activeProject === 'product' && (
                  <motion.div 
                    key="page1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center"
                  >
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">Case Study / 01</span>
                        <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">从“手工业务”到<br/>“中台产品化”</h3>
                      </div>
                      <div className="text-white/60 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif space-y-6">
                        <p>2025年底，在负责集团财务建模与管报出具期间，我敏锐地察觉到现有流程中潜藏的标准化价值。</p>
                        <p>为了将人力从低效的重复脑力劳动中释放，归还思考的自由，我选择以一家子公司为试点，开始在 IDE 上用 Python 对非标数据建模进行抽象。</p>
                        <p>我独立完成了从底层研发、系统测试到全链路闭环的验证，并将沉淀的自动化架构转化为成熟的产品设计方案，成功移交 IT 部门，实现了从“手工业务”到“中台产品化”的资产沉淀。</p>
                      </div>
                    </div>

                    <div className="relative">
                      {/* 继续探索按钮 - 在图片框外面的正上方 */}
                      <button onClick={() => setActiveProject('product-2')} onMouseEnter={handleMouseEnter} className="group absolute -top-24 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4 text-sm md:text-base tracking-[0.5em] uppercase text-indigo-300 font-light font-sans px-6 py-3 transition-all duration-700">
                        <span className="underline-slide text-gentle-breath">继续探索</span>
                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-700" />
                      </button>

                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -8 }}
                        className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
                        style={{
                          cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
                        }}
                      >
                        {/* 底部发光效果 */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
                        <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />

                      <img 
                        src="https://raw.githubusercontent.com/zhong215/Web/main/Frame.svg" 
                        alt="Case Study Architecture" 
                        onClick={() => {
                          setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/Frame.svg");
                          setScale(1);
                        }}
                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </motion.div>
                    </div>
                  </motion.div>
                )}

                {activeProject === 'product-2' && (
                  <motion.div 
                    key="page2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center"
                  >
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">Case Study / 02</span>
                        <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">从 MVP 落地到<br/>技术架构沉淀</h3>
                      </div>
                      <div className="text-white/60 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif space-y-6">
                        <p>在子公司成功交付最小可行性产品（MVP）后，我同步完成了全套产品架构设计与技术标准文档，确立了系统的持续演进能力。</p>
                        <p>该产品将分析师以往碎片化、非标的数据建模过程，转化为可沉淀、可复用的企业数字资产，极大地提升了数据的可读性与横向可比性。</p>
                        <p>在确保管理报告实时、精准、零误差的同时，<span className="text-indigo-300 font-medium not-italic">它更深层的意义在于实现了智力资源的二次分配——将财务人员从繁琐的计算逻辑中抽离，使其注意力回归到“商业定义”本身，从而为管理决策提供更具洞察力的核心价值。</span></p>
                      </div>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -8 }}
                      className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
                      style={{
                        cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
                      }}
                    >
                      {/* 底部发光效果 */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
                      <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />
                      
                      <img 
                        src="https://raw.githubusercontent.com/zhong215/Web/main/%E6%8A%80%E6%9C%AF%E6%96%87%E6%A1%A3.png" 
                        alt="Technical Documentation" 
                        onClick={() => {
                          setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/%E6%8A%80%E6%9C%AF%E6%96%87%E6%A1%A3.png");
                          setScale(1);
                        }}
                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] invert drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </motion.div>
                  </motion.div>
                )}

                {activeProject === 'architect' && (
                  <motion.div 
                    key="architect"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center"
                  >
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">Case Study</span>
                        <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">减法重塑决策</h3>
                      </div>
                      <div className="text-white/60 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif space-y-6">
                        <p>对人工智能产生兴趣的期间，我回顾了计算机发展史。意外从图灵机的底层逻辑中汲取灵感，敏锐地察觉到：分析报告的本质并非数据的堆砌，而是层层递进的“减法”。</p>
                        <p>我开始落地这套减法:自己本地部署了 Qwen 大模型，用Python搭建了一套 AI 分析系统 Demo。将前端自动化管报重构为LLM易读的 Markdown 结构，并配合 RAG 业务库与提示词工程，在算法层面实现了从“部门小报告”到“集团汇总报告”的逻辑递进。</p>
                        <p>真正的稀缺资源不是数据，而是极致的“注意力”。</p>
                        <p>对大模型而言，这意味着高浓度的语义抓取；对管理者而言，这代表着跨越噪音的决策定力。我所做的，是从冗余中打捞实质，在杂音中锚定方向。不盲目追求工具的全面，只在万千利刃中，选出最合适的。</p>
                      </div>
                    </div>

                    <div className="relative">
                      {/* 继续探索按钮 - 在图片框外面的正上方 */}
                      <button onClick={() => setActiveProject('architect-2')} onMouseEnter={handleMouseEnter} className="group absolute -top-24 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4 text-sm md:text-base tracking-[0.5em] uppercase text-indigo-300 font-light font-sans px-6 py-3 transition-all duration-700">
                        <span className="underline-slide text-gentle-breath">继续探索</span>
                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-700" />
                      </button>

                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -8 }}
                        className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
                        style={{
                          cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
                        }}
                      >
                        {/* 底部发光效果 */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
                        <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />

                      <img 
                        src="https://raw.githubusercontent.com/zhong215/Web/main/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260224121525_199_2.jpg" 
                        alt="AI Analysis Demo" 
                        onClick={() => {
                          setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260224121525_199_2.jpg");
                          setScale(1);
                        }}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10 rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </motion.div>
                    </div>
                  </motion.div>
                )}

                {activeProject === 'architect-2' && (
                  <motion.div 
                    key="architect-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center"
                  >
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">Case Study / 02</span>
                        <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">逻辑的锚点：从原子任务到系统性涌现</h3>
                      </div>
                      <div className="text-white/60 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif space-y-6">
                        <p>为了确保大模型在复杂财务逻辑中的减少幻觉，我构建了一套严密的执行框架：</p>
                        <ul className="list-disc pl-5 space-y-4">
                          <li><strong className="text-indigo-300 font-medium not-italic">结构化提示词：</strong>过定义 Role（专家身份） 赋予模型专业视角，设定 Constraints(边界约束） 防止发散式的偏差，预设 Format（输出格式） 确保分析结果能无缝接入后续业务流。</li>
                          <li><strong className="text-indigo-300 font-medium not-italic">上下文管理：</strong>秉持“减法”原则，将庞杂的财务分析拆解为原子级的子任务。以仓储业务为例，将其细分为固定成本、变动成本、大客户等独立维度。通过降低单次处理负荷，减少模型的幻觉和消耗。</li>
                          <li><strong className="text-indigo-300 font-medium not-italic">链式事实缓存：</strong>每个子模块缓存“核心事实摘要（Summary）”并传递至下一环。这种层层递进的过滤式逻辑闭环，既节省了 Token 资源，又确保了最终汇总报告具备严丝合缝的连贯性。</li>
                        </ul>
                      </div>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -8 }}
                      className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700 flex flex-col"
                      style={{
                        cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
                      }}
                    >
                      {/* 底部发光效果 */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
                      <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />
                      
                      <div className="relative flex-1 w-full overflow-hidden rounded-2xl">
                        <AnimatePresence mode="wait">
                          <motion.img 
                            key={architectImageIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            src={
                              architectImageIndex === 0 
                                ? "https://raw.githubusercontent.com/zhong215/Web/main/%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%B7%A5%E7%A8%8B.png"
                                : "https://raw.githubusercontent.com/zhong215/Web/main/%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%86%85%E5%AE%B9.png"
                            }
                            alt="Prompt Engineering" 
                            onClick={() => {
                              setLightboxImage(
                                architectImageIndex === 0 
                                  ? "https://raw.githubusercontent.com/zhong215/Web/main/%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%B7%A5%E7%A8%8B.png"
                                  : "https://raw.githubusercontent.com/zhong215/Web/main/%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%86%85%E5%AE%B9.png"
                              );
                              setScale(1);
                            }}
                            className="absolute inset-0 w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] z-10"
                            referrerPolicy="no-referrer"
                          />
                        </AnimatePresence>
                      </div>
                      
                      {/* Image Slider Controls */}
                      <div className="flex justify-center space-x-4 mt-8 z-20">
                        <button 
                          onClick={() => setArchitectImageIndex(0)}
                          className={`w-2 h-2 rounded-full transition-all duration-500 ${architectImageIndex === 0 ? 'bg-indigo-400 w-6' : 'bg-white/20 hover:bg-white/50'}`}
                        />
                        <button 
                          onClick={() => setArchitectImageIndex(1)}
                          className={`w-2 h-2 rounded-full transition-all duration-500 ${architectImageIndex === 1 ? 'bg-indigo-400 w-6' : 'bg-white/20 hover:bg-white/50'}`}
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                    </motion.div>
                  </motion.div>
                )}

                {activeProject === 'user' && (
                  <motion.div 
                    key="user"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center"
                  >
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">Case Study / 01</span>
                        <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">以产品思维重构<br/>财务数字化培训</h3>
                      </div>
                      <div className="text-white/60 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif space-y-6">
                        <p>在我眼中，万物皆产品。</p>
                        <p>我很享受与用户全方位的交互，即便是一场培训。从PPT内容的视觉呈现，到教室灯光的氛围营造，再到与观众（我的用户）眼神与言语的即时互动，每一个环节都需要精心打磨。如何平衡“直白的表达”与“留白的想象”，于我而言，是一场极具趣味的系统设计。</p>
                        <p>面对这场30人的培训，我不断自问：用户真正需要的是什么？</p>
                        <p>在这个时代，他们需要的或许不再是枯燥工具的堆砌，而是审美力的觉醒与深度的思考。</p>
                        <p>为此，我构建了“坐标（时间维度的技术延伸）”与“共振（空间维度的技术延伸）”双重维度，试图探讨人与技术的共生关系。</p>
                        <p>我尝试以财务逻辑为比喻，跨界融合编程、摄影与音乐艺术，启发用户在数字化浪潮中的跨学科思考。</p>
                        <p>在组织中，若想激发人的潜力，必先让他们感知美的存在，并相信自身的力量。</p>
                      </div>
                    </div>

                    <div className="relative">
                      {/* 继续探索按钮 - 在图片框外面的正上方 */}
                      <button onClick={() => setActiveProject('user-2')} onMouseEnter={handleMouseEnter} className="group absolute -top-24 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4 text-sm md:text-base tracking-[0.5em] uppercase text-indigo-300 font-light font-sans px-6 py-3 transition-all duration-700">
                        <span className="underline-slide text-gentle-breath">继续探索</span>
                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-700" />
                      </button>

                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -8 }}
                        className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
                        style={{
                          cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
                        }}
                      >
                        {/* 底部发光效果 */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
                        <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />

                      <img 
                        src="https://raw.githubusercontent.com/zhong215/Web/main/PPT%E7%A8%8B%E5%BA%8F%E8%AF%AD%E8%A8%80.png" 
                        alt="PPT Programming Language" 
                        onClick={() => {
                          setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/PPT%E7%A8%8B%E5%BA%8F%E8%AF%AD%E8%A8%80.png");
                          setScale(1);
                        }}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10 rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </motion.div>
                    </div>
                  </motion.div>
                )}

                {activeProject === 'user-2' && (
                  <motion.div 
                    key="user-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-48 items-center"
                  >
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <span className="text-indigo-400/60 text-[10px] font-mono tracking-[0.8em] uppercase">Case Study / 02</span>
                        <h3 className="text-3xl md:text-5xl font-extralight tracking-tight leading-tight font-serif">回归本质:系统<br/>背后的“人”与“物”</h3>
                      </div>
                      <div className="text-white/60 font-light leading-[2.4] text-sm md:text-base tracking-wide font-serif space-y-6">
                        <p>这是培训中的一个切片：我展示了两幅风格迥异、但主题相同的摄影作品。</p>
                        <p>我想通过这个跨界隐喻，去探讨“感性的人”与“理性系统”之间的关系。</p>
                        <p>那些最能触动人心的感性瞬间，其底层往往是由看不见的极其缜密的表达逻辑和系统框架支撑起来的。</p>
                        <p>这正是我想要给财务人员的思考空间：</p>
                        <p>对于把自己变为技术系统本身是否已经超越了我们对现实问题的关注?在信息爆炸的年代，怎么去寻找自己的定力?</p>
                      </div>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -8 }}
                      className="relative aspect-[3/2] bg-gradient-to-br from-white/[0.05] to-transparent rounded-[3rem] p-12 group overflow-visible border border-white/10 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_80px_rgba(99,102,241,0.4),0_-5px_40px_rgba(99,102,241,0.2)] transition-all duration-700"
                      style={{
                        cursor: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\'%3E%3Cg fill=\'none\' stroke=\'%23a5b4fc\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'7\' opacity=\'0.5\'/%3E%3Cpath stroke-linecap=\'round\' d=\'M15 15l6 6\'/%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'4\' fill=\'%23818cf8\' opacity=\'0.2\'/%3E%3C/g%3E%3C/svg%3E") 16 16, zoom-in'
                      }}
                    >
                      {/* 底部发光效果 */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-indigo-500/0 to-transparent opacity-0 group-hover:opacity-100 group-hover:from-indigo-400/60 transition-all duration-700 blur-xl" />
                      <div className="absolute -bottom-4 left-1/4 right-1/4 h-8 bg-indigo-400/30 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl rounded-full" />
                      
                      <img 
                        src="https://raw.githubusercontent.com/zhong215/Web/main/PPT%E5%9F%B9%E8%AE%AD.png" 
                        alt="PPT Training" 
                        onClick={() => {
                          setLightboxImage("https://raw.githubusercontent.com/zhong215/Web/main/PPT%E5%9F%B9%E8%AE%AD.png");
                          setScale(1);
                        }}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[3s] drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] relative z-10 rounded-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-indigo-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0F172A]/95 backdrop-blur-xl flex items-center justify-center overflow-hidden"
            onClick={() => setLightboxImage(null)}
          >
            <button 
              className="absolute top-8 right-8 z-[101] p-4 text-white/50 hover:text-white transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X size={32} />
            </button>
            <motion.div 
              className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                e.stopPropagation();
                setScale((prev) => Math.min(Math.max(0.5, prev - e.deltaY * 0.005), 5));
              }}
            >
              <motion.img
                src={lightboxImage}
                drag
                dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
                dragElastic={0.1}
                style={{ scale }}
                className="max-w-[90vw] max-h-[90vh] object-contain invert drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                referrerPolicy="no-referrer"
                draggable={false}
              />
            </motion.div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-[10px] tracking-[0.2em] font-sans pointer-events-none">
              Scroll to zoom • Drag to pan
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

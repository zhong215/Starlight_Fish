import React, { useEffect, useRef } from 'react';

interface BokehParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  color?: string; // 选项颜色
}

// 汇聚粒子
interface FormationParticle {
  x: number;
  y: number;
  targetOffsetX: number;  // 相对于鱼位置的偏移量
  targetOffsetY: number;  // 相对于鱼位置的偏移量
  startX: number;
  startY: number;
  size: number;
  alpha: number;
  delay: number;
}

// 鱼群中的单条鱼
class MinimalFish {
  x: number;
  y: number;
  angle: number;
  velocity: number;
  turnSpeed: number;
  hue: number;
  isWhite: boolean;
  history: { x: number; y: number }[];
  historyLimit: number;
  interactFactor: number;
  crackInfluence: number; // 裂缝影响因子(0-1, 用于控制消失效果)
  isAttractedToCrack: boolean; // 是否被裂缝吸引(随机30%的鱼会被吸引)

  constructor(width: number, height: number, spawnPosition?: { x: number; y: number }, direction?: 'up' | 'down') {
    const cx = width / 2;
    const cy = height / 2;
    
    // 如果指定了生成位置(用于钻出效果)，则从裂缝垂直涌出
    if (spawnPosition && direction) {
      // 基准角度：向上(-90°)或向下(+90°)
      const baseAngle = direction === 'up' ? -Math.PI / 2 : Math.PI / 2;
      
      // 初始距离：0-50px，从裂缝中心逐渐涌出
      const spawnDist = Math.random() * 50;
      
      // === S型曲线涌出（两个方向） ===
      // 使用正弦波创建S型，基于垂直距离
      const sPhase = Math.random() * Math.PI * 2; // 每条鱼在S波上的随机相位
      const sAmplitude = 60 + Math.random() * 40; // S型振幅：60-100px
      const sFrequency = 0.02; // S波频率
      
      if (direction === 'up') {
        // 要有光页面：向上S型涌出
        const verticalOffset = -spawnDist; // 负值表示向上
        const horizontalOffset = Math.sin(spawnDist * sFrequency + sPhase) * sAmplitude;
        
        this.x = spawnPosition.x + horizontalOffset;
        this.y = spawnPosition.y + verticalOffset;
        
        // 朝向：沿着S曲线的切线方向
        const sTangent = Math.cos(spawnDist * sFrequency + sPhase) * sFrequency * sAmplitude;
        this.angle = Math.atan2(-1, sTangent) + (Math.random() - 0.5) * 0.3;
        
      } else {
        // 深海之光页面：向下S型涌出（镜像）
        const verticalOffset = spawnDist; // 正值表示向下
        // 镜像S型：使用负号反转水平方向
        const horizontalOffset = -Math.sin(spawnDist * sFrequency + sPhase) * sAmplitude;
        
        this.x = spawnPosition.x + horizontalOffset;
        this.y = spawnPosition.y + verticalOffset;
        
        // 朝向：沿着镜像S曲线的切线方向
        const sTangent = -Math.cos(spawnDist * sFrequency + sPhase) * sFrequency * sAmplitude;
        this.angle = Math.atan2(1, sTangent) + (Math.random() - 0.5) * 0.3;
      }
      
      // 初始速度稍快，营造"喷出"的力量感
      this.velocity = 1.0 + Math.random() * 1.5;
    } else if (spawnPosition) {
      // 向后兼容：如果没有direction参数，使用旧的烟花式效果
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = 20 + Math.random() * 130;
      this.x = spawnPosition.x + Math.cos(spawnAngle) * spawnDist;
      this.y = spawnPosition.y + Math.sin(spawnAngle) * spawnDist;
      this.angle = spawnAngle + (Math.random() - 0.5) * 0.8;
      this.velocity = 0.5 + Math.random() * 1.5;
    } else {
      // 秩序初始化：以中心为圆心呈螺旋状排列
      const angleOffset = Math.random() * Math.PI * 2;
      const maxRadius = Math.min(width, height) * 0.45;
      const minRadius = 50;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      
      this.x = cx + Math.cos(angleOffset) * radius;
      this.y = cy + Math.sin(angleOffset) * radius;
      
      // 初始朝向：切线方向，确保开局即是有秩序的旋转游动
      this.angle = angleOffset + Math.PI / 2;
      this.velocity = 0.5 + Math.random() * 1.5;
    }
    this.turnSpeed = 0.012 + Math.random() * 0.02;
    
    // 梵高星空配色：深蓝夜空 + 浅黄 + 深金黄三层次
    const colorRand = Math.random();
    if (colorRand < 0.2) {
      // 20% 深蓝夜空色系（保持不变）
      this.hue = 200 + Math.random() * 20; // 色相200-220（深蓝到青蓝）
      this.isWhite = Math.random() > 0.7; // 30%较亮深蓝
    } else if (colorRand < 0.65) {
      // 45% 浅黄/柠檬黄色系（中间过渡层）
      this.hue = 52 + Math.random() * 15; // 色相52-67（柠檬黄到黄绿）
      this.isWhite = Math.random() > 0.5; // 50%更亮
    } else {
      // 35% 深金黄/橙黄色系（核心最黄部分）
      this.hue = 38 + Math.random() * 12; // 色相38-50（橙黄到金黄）
      this.isWhite = Math.random() > 0.45; // 55%更亮，更饱满的金黄
    }
    
    this.history = [];
    this.historyLimit = 6 + Math.floor(Math.random() * 8);
    
    this.interactFactor = 0;
    // 钻出模式：初始完全透明，逐渐显现
    this.crackInfluence = spawnPosition ? 1.0 : 0;
    this.isAttractedToCrack = Math.random() < 0.3; // 30%的鱼会被裂缝吸引
  }

  update(
    width: number, 
    height: number, 
    mouse: { x: number; y: number; active: boolean }, 
    time: number, 
    vineNodes: VineNode[] = [],
    crackPosition: { x: number; y: number } | null = null,
    crackActive: boolean = false,
    isDrilling: boolean = false,
    flashlightPos: { x: number; y: number } | null = null
  ) {
    const cx = width / 2;
    const cy = height / 2;
    const distToCenter = Math.hypot(this.x - cx, this.y - cy);
    const angleToCenter = Math.atan2(this.y - cy, this.x - cx);
    
    // 梵高流场核心：切线方向 + 随距离变化的向心/离心扰动
    const flowAngle = angleToCenter + Math.PI / 2 + Math.sin(distToCenter * 0.005 + time * 0.01) * 0.4;
    
    let targetAngle = flowAngle;

    // === 藤蔓吸引力场计算 ===
    if (vineNodes.length > 0) {
      // 找到最近的藤蔓节点
      let minDist = Infinity;
      let nearestNode: VineNode | null = null;
      
      for (const node of vineNodes) {
        const dist = Math.hypot(this.x - node.x, this.y - node.y);
        if (dist < minDist) {
          minDist = dist;
          nearestNode = node;
        }
      }
      
      if (nearestNode && minDist < 150) {
        // 吸引力场作用范围：150px内
        const angleToVine = Math.atan2(nearestNode.y - this.y, nearestNode.x - this.x);
        
        if (minDist < 30) {
          // 距离太近时切换为排斥力,避免鱼"粘"在藤蔓上
          const repelFactor = (30 - minDist) / 30 * 0.3;
          let diff = angleToVine - flowAngle + Math.PI; // +Math.PI 反向
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          targetAngle = flowAngle + diff * repelFactor;
        } else {
          // 吸引力场：强度随距离衰减
          const attractForce = nearestNode.strength / (minDist * minDist) * 800;
          const attractFactor = Math.min(0.4, attractForce); // 限制最大影响
          let diff = angleToVine - flowAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          targetAngle = flowAngle + diff * attractFactor;
        }
      }
    }

    // === 裂缝吸引力场计算 ===
    // 钻入模式：所有鱼都被吸引（忽略 isAttractedToCrack）
    const shouldAttractToCrack = isDrilling || (crackActive && this.isAttractedToCrack);
    
    if (shouldAttractToCrack && crackPosition) {
      const distToCrack = Math.hypot(this.x - crackPosition.x, this.y - crackPosition.y);
      
      // 钻入模式下的吸引范围更大
      const attractRange = isDrilling ? 2000 : 400;
      
      if (distToCrack < attractRange) {
        const angleToCrack = Math.atan2(crackPosition.y - this.y, crackPosition.x - this.x);
        
        // 钻入模式下吸引力更强
        const baseStrength = isDrilling 
          ? Math.pow((attractRange - distToCrack) / attractRange, 0.8)
          : Math.pow((attractRange - distToCrack) / attractRange, 1.2);
        const attractFactor = baseStrength * (isDrilling ? 0.95 : 0.6);
        
        let diff = angleToCrack - targetAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        targetAngle = targetAngle + diff * attractFactor;
        
        // 更新裂缝影响因子
        if (isDrilling) {
          // 钻入模式：快速消失
          if (distToCrack < 100) {
            this.crackInfluence = Math.min(1, this.crackInfluence + 0.15);
          } else if (distToCrack < 300) {
            this.crackInfluence = Math.min(1, this.crackInfluence + 0.08);
          } else {
            this.crackInfluence = Math.min(0.8, this.crackInfluence + 0.04);
          }
        } else {
          // 普通悬停模式
          if (distToCrack < 50) {
            this.crackInfluence = Math.min(1, this.crackInfluence + 0.08);
          } else if (distToCrack < 150) {
            this.crackInfluence = Math.min(1, this.crackInfluence + 0.02);
          } else {
            this.crackInfluence = Math.min(0.5, this.crackInfluence + 0.01);
          }
        }
      } else {
        // 超出吸引范围，影响因子逐渐恢复
        this.crackInfluence = Math.max(0, this.crackInfluence - 0.02);
      }
    } else {
      // 裂缝未激活，影响因子逐渐恢复（钻出显现效果）
      // 如果是从高透明度开始（钻出模式），加快显现速度
      const recoverSpeed = this.crackInfluence > 0.5 ? 0.06 : 0.03;
      this.crackInfluence = Math.max(0, this.crackInfluence - recoverSpeed);
    }

    // === 手电筒光圈吸引力场计算 ===
    if (flashlightPos) {
      const distToLight = Math.hypot(this.x - flashlightPos.x, this.y - flashlightPos.y);
      
      // 吸引范围：光圈外围，适配光圈（135px）
      const minRange = 45;  // 最小距离，避免鱼群进入光圈中心
      const maxRange = 270; // 最大吸引范围
      
      if (distToLight > minRange && distToLight < maxRange) {
        // 计算向光的角度
        const angleToLight = Math.atan2(flashlightPos.y - this.y, flashlightPos.x - this.x);
        
        // 吸引力强度：随距离衰减，在 135-190px 处最强
        const normalizedDist = (distToLight - minRange) / (maxRange - minRange);
        const attractStrength = Math.pow(1 - Math.abs(normalizedDist - 0.4), 1.5) * 0.35;
        
        // 计算角度差异
        let diff = angleToLight - targetAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        // 叠加光吸引力向量
        targetAngle = targetAngle + diff * attractStrength;
      }
    }

    // 交互切换逻辑
    if (mouse.active) {
      this.interactFactor = this.lerp(this.interactFactor, 1, 0.02);
    } else {
      this.interactFactor = this.lerp(this.interactFactor, 0, 0.01);
    }

    if (this.interactFactor > 0.01) {
      const angleToMouse = Math.atan2(mouse.y - this.y, mouse.x - this.x);
      let diff = angleToMouse - flowAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      targetAngle = flowAngle + diff * this.interactFactor;
    }

    let angleDiff = targetAngle - this.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.angle += angleDiff * this.turnSpeed;

    const currentMaxSpeed = mouse.active ? 3.0 : 1.8;
    this.velocity = this.lerp(this.velocity, currentMaxSpeed, 0.02);

    const vx = Math.cos(this.angle) * this.velocity;
    const vy = Math.sin(this.angle) * this.velocity;

    this.x += vx;
    this.y += vy;

    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > this.historyLimit) this.history.pop();

    // 边界环绕
    if (this.x < -60) this.x = width + 60;
    if (this.x > width + 60) this.x = -60;
    if (this.y < -60) this.y = height + 60;
    if (this.y > height + 60) this.y = -60;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.history.length < 2) return;
    // 梵高星空配色：金黄色系使用更高亮度和不透明度，深蓝色系保持夜空背景感
    const isGoldenHue = this.hue >= 30 && this.hue <= 70; // 判断是否为金黄色系
    const baseOpacity = isGoldenHue 
      ? (this.isWhite ? 0.85 : 0.7)  // 金黄色：高不透明度（明亮耀眼）
      : (this.isWhite ? 0.65 : 0.5); // 深蓝色：中等不透明度（夜空背景）
    const lightness = isGoldenHue
      ? (this.isWhite ? 95 : 85)     // 金黄色：高亮度（温暖明亮）
      : (this.isWhite ? 88 : 78);    // 深蓝色：中等亮度（深邃夜空）

    // 根据裂缝影响因子调整透明度（消失效果）
    const crackFadeMultiplier = 1 - this.crackInfluence;

    // 绘制轨迹
    for (let i = 1; i < this.history.length; i++) {
      const p1 = this.history[i - 1];
      const p2 = this.history[i];
      if (Math.abs(p1.x - p2.x) > 100 || Math.abs(p1.y - p2.y) > 100) continue;

      const ratio = 1 - (i / this.history.length);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `hsla(${this.hue}, 100%, ${lightness}%, ${baseOpacity * ratio * crackFadeMultiplier})`;
      ctx.lineWidth = 1.4 * ratio;
      ctx.stroke();
    }

    // 绘制鱼身
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const bodyGrd = ctx.createLinearGradient(-8, 0, 5, 0);
    bodyGrd.addColorStop(0, 'transparent');
    bodyGrd.addColorStop(1, `hsla(${this.hue}, 100%, ${lightness}%, ${baseOpacity * crackFadeMultiplier})`);
    ctx.fillStyle = bodyGrd;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${crackFadeMultiplier})`;
    ctx.beginPath();
    ctx.arc(6, 0, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  lerp(a: number, b: number, n: number) {
    return (1 - n) * a + n * b;
  }

  shouldSpawnParticle(): boolean {
    return Math.random() > 0.94;
  }
}

// 鱼群散发的光粒子
class LightParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  hue: number;
  size: number;

  constructor(x: number, y: number, hue: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.life = 1.0;
    this.decay = 0.015 + Math.random() * 0.025;
    this.hue = hue;
    this.size = 0.5 + Math.random() * 0.8;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life * 0.5;
    ctx.fillStyle = `hsla(${this.hue}, 100%, 95%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
    if (this.life > 0.5) {
      ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3 * this.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}



interface VineNode {
  x: number;
  y: number;
  strength: number;
}

interface FishPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface DeepSeaCanvasProps {
  externalTarget?: { x: number; y: number } | null;
  triggerDash?: boolean;
  showSchool?: boolean; // 是否显示鱼群
  vineNodes?: VineNode[]; // 藤蔓节点位置(用于吸引力场)
  onFishUpdate?: (fishData: FishPosition[]) => void; // 鱼群位置更新回调
  crackPosition?: { x: number; y: number } | null; // 裂缝位置(用于吸引鱼群)
  crackActive?: boolean; // 裂缝是否激活
  isDrilling?: boolean; // 是否正在钻入
  drillingTarget?: { section: string; position: { x: number; y: number } } | null; // 钻入目标
  flashlightPos?: { x: number; y: number } | null; // 手电筒位置(用于吸引鱼群)
}

export const DeepSeaCanvas: React.FC<DeepSeaCanvasProps> = ({ 
  externalTarget, 
  triggerDash, 
  showSchool = false,
  vineNodes = [],
  onFishUpdate,
  crackPosition = null,
  crackActive = false,
  isDrilling = false,
  drillingTarget = null,
  flashlightPos = null
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0, active: false, lastMoveTime: 0, isHovering: false });
  
  // 使用ref保存最新的drilling状态，避免闭包问题
  const isDrillingRef = useRef(isDrilling);
  const drillingTargetRef = useRef(drillingTarget);
  const crackPositionRef = useRef(crackPosition);
  const crackActiveRef = useRef(crackActive);
  const flashlightPosRef = useRef(flashlightPos);
  
  // 同步更新ref值
  useEffect(() => {
    isDrillingRef.current = isDrilling;
    console.log('Canvas: isDrilling 更新为', isDrilling);
  }, [isDrilling]);
  
  useEffect(() => {
    drillingTargetRef.current = drillingTarget;
    console.log('Canvas: drillingTarget 更新为', drillingTarget);
  }, [drillingTarget]);
  
  useEffect(() => {
    crackPositionRef.current = crackPosition;
  }, [crackPosition]);
  
  useEffect(() => {
    crackActiveRef.current = crackActive;
  }, [crackActive]);
  
  useEffect(() => {
    flashlightPosRef.current = flashlightPos;
  }, [flashlightPos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 移动设备检测和性能优化
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth < 768;
    const isLowEndDevice = isMobile && (navigator.hardwareConcurrency || 0) <= 4;
    
    // 声明所有变量
    const particles: (BokehParticle & { lifeProgress: number })[] = [];
    // 根据设备性能调整鱼群数量
    const FISH_COUNT = isLowEndDevice ? 150 : (isMobile ? 300 : 800);
    const fishArray: MinimalFish[] = [];
    const lightParticles: LightParticle[] = [];
    const schoolMouse = { x: -1000, y: -1000, active: false };
    const fishPos = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 }; // 主鱼位置
    
    // 汇聚动画相关
    let formationProgress = 1; // 直接完全显示，不需要汇聚动画
    const formationParticles: FormationParticle[] = [];
    const FORMATION_DURATION = 240; // 4秒 @ 60fps，更慢的汇聚
    
    // 行星轨道运动相关
    let orbitActive = false; // 是否启用行星轨道运动
    let orbitPhase = 0; // 轨道运动相位
    const ZEN_HOVER_THRESHOLD = 4000; // 4秒悬停阈值（毫秒）
    let orbitRadiusX = 220; // 椭圆轨道X半径
    let orbitRadiusY = 140; // 椭圆轨道Y半径
    let orbitCenterX = 0; // 轨道中心X
    let orbitCenterY = 0; // 轨道中心Y
    
    // 初始化鱼群（仅在showSchool为true时）
    if (showSchool) {
      for (let i = 0; i < FISH_COUNT; i++) {
        fishArray.push(new MinimalFish(width, height));
      }
    }

    // 定义函数
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      fishPos.x = width / 2;
      fishPos.y = height / 2;
      // 重新初始化鱼群（仅在showSchool为true时）
      if (showSchool) {
        fishArray.length = 0;
        for (let i = 0; i < FISH_COUNT; i++) {
          fishArray.push(new MinimalFish(width, height));
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - width / 2;
      const newY = e.clientY - height / 2;
      
      // 检测鼠标是否移动
      const moved = Math.abs(newX - mouse.current.x) > 2 || Math.abs(newY - mouse.current.y) > 2;
      
      mouse.current.x = newX;
      mouse.current.y = newY;
      mouse.current.active = true;
      
      if (moved) {
        mouse.current.lastMoveTime = Date.now();
        mouse.current.isHovering = false;
        
        if (orbitActive) {
          // 退出行星轨道模式
          orbitActive = false;
        }
      }
      
      // 鱼群鼠标交互
      schoolMouse.x = e.clientX;
      schoolMouse.y = e.clientY;
      schoolMouse.active = true;
    };

    const handleMouseLeave = () => {
      schoolMouse.active = false;
    };

    // 注册事件监听器
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    resize();
    
    // 初始化鼠标时间
    mouse.current.lastMoveTime = Date.now();

    let animationFrame: number;
    let time = 0;
    let frameCount = 0;
    let lastDrillingState = isDrilling;
    
    // 钻出动画相关变量
    let isDrillingOut = false; // 是否正在钻出
    let drillingOutProgress = 0; // 钻出进度 (0-1)
    let drillingOutStartFrame = 0; // 开始钻出的帧数
    const DRILLING_OUT_DURATION = 120; // 钻出动画持续帧数 (约2秒 @ 60fps)
    let drillingOutPosition: { x: number; y: number } | null = null; // 钻出位置

    const render = () => {
      time += 0.016; // Approx 60fps
      frameCount++;
      
      // 使用ref读取最新值
      const currentIsDrilling = isDrillingRef.current;
      const currentDrillingTarget = drillingTargetRef.current;
      
      // 检测钻出效果开始
      if (!currentIsDrilling && lastDrillingState && currentDrillingTarget) {
        console.log('Canvas: 触发钻出效果，位置:', currentDrillingTarget.position);
        // 开始钻出动画
        isDrillingOut = true;
        drillingOutProgress = 0;
        drillingOutStartFrame = frameCount;
        drillingOutPosition = currentDrillingTarget.position;
        
        // 清空现有鱼群，准备逐渐生成
        fishArray.length = 0;
        lightParticles.length = 0;
        console.log('Canvas: 开始钻出动画，目标section:', currentDrillingTarget.section);
      }
      lastDrillingState = currentIsDrilling;
      
      // 处理钻出动画进度
      if (isDrillingOut && drillingOutPosition) {
        const elapsedFrames = frameCount - drillingOutStartFrame;
        drillingOutProgress = Math.min(1, elapsedFrames / DRILLING_OUT_DURATION);
        
        // 根据进度计算应该有多少鱼
        const targetFishCount = Math.floor(FISH_COUNT * drillingOutProgress);
        
        // 逐渐添加鱼（每帧添加一定数量）
        if (fishArray.length < targetFishCount) {
          const fishToAdd = Math.min(15, targetFishCount - fishArray.length); // 每帧最多添加15条
          
          // 决定钻出方向：section为'light'表示从顶部钻出(向上)，'deep-sea'表示从底部钻出(向下)
          const currentDrillingTargetValue = drillingTargetRef.current;
          const flowDirection = currentDrillingTargetValue?.section === 'light' ? 'up' : 'down';
          
          for (let i = 0; i < fishToAdd; i++) {
            fishArray.push(new MinimalFish(width, height, drillingOutPosition, flowDirection));
          }
          if (frameCount % 10 === 0) { // 每10帧打印一次，避免日志过多
            console.log('Canvas: 钻出进度', Math.floor(drillingOutProgress * 100) + '%', '鱼数量:', fishArray.length, '方向:', flowDirection);
          }
        }
        
        // 钻出动画完成
        if (drillingOutProgress >= 1) {
          isDrillingOut = false;
          drillingOutPosition = null;
          console.log('Canvas: 钻出动画完成，共', fishArray.length, '条鱼');
        }
      }
      
      // Background: Deep, dark, ethereal - 根据是否显示鱼群调整背景透明度
      ctx.fillStyle = showSchool ? 'rgba(2, 6, 23, 0.38)' : '#020617';
      ctx.fillRect(0, 0, width, height);

      // === 绘制鱼群（背景层）- 仅在showSchool为true时 ===
      if (showSchool) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 更新和绘制鱼群
        fishArray.forEach(fish => {
          // 使用ref读取最新值
          const currentCrackPos = crackPositionRef.current;
          const currentCrackActive = crackActiveRef.current || isDrillingRef.current;
          const currentIsDrilling = isDrillingRef.current;
          const currentFlashlightPos = flashlightPosRef.current;
          
          fish.update(width, height, schoolMouse, time, vineNodes, currentCrackPos, currentCrackActive, currentIsDrilling, currentFlashlightPos);
          fish.draw(ctx);
          
          // 生成光粒子
          if (fish.shouldSpawnParticle()) {
            lightParticles.push(new LightParticle(fish.x, fish.y, fish.hue));
          }
        });
        
        // 每3帧输出一次靠近左侧边栏的鱼的位置数据(~20fps,性能优化)
        if (frameCount % 3 === 0 && onFishUpdate) {
          const leftFish = fishArray
            .filter(f => f.x < 300 && f.x > 0 && f.y > 0 && f.y < height)
            .slice(0, 20) // 限制最多20条鱼
            .map(f => ({
              x: f.x,
              y: f.y,
              vx: Math.cos(f.angle) * f.velocity,
              vy: Math.sin(f.angle) * f.velocity
            }));
          onFishUpdate(leftFish);
        }
        
        // 更新和绘制光粒子
        for (let i = lightParticles.length - 1; i >= 0; i--) {
          lightParticles[i].update();
          if (lightParticles[i].life <= 0) {
            lightParticles.splice(i, 1);
          } else {
            lightParticles[i].draw(ctx);
          }
        }
        
        ctx.restore();
      }

      // === 绘制主鱼和其粒子（前景层）===
      // 检查鼠标悬停状态
      if (!showSchool && mouse.current.active && !mouse.current.isHovering) {
        const hoverTime = Date.now() - mouse.current.lastMoveTime;
        if (hoverTime > ZEN_HOVER_THRESHOLD) {
          mouse.current.isHovering = true;
          orbitActive = true;
          orbitPhase = 0;
          // 初始化轨道中心
          orbitCenterX = width / 2;
          orbitCenterY = height / 2;
          // 添加随机性，让轨道更自然
          orbitRadiusX = 180 + Math.random() * 80;
          orbitRadiusY = 120 + Math.random() * 60;
        }
      }
      
      // Fish movement logic
      let targetX, targetY;
      
      if (!showSchool && orbitActive) {
        // 行星轨道运动模式 - 椭圆轨道，像在寻觅什么
        orbitPhase += 0.008; // 缓慢运动
        
        // 轨道中心缓慢漂移，增加探索感
        const driftX = Math.sin(orbitPhase * 0.3) * 40;
        const driftY = Math.cos(orbitPhase * 0.4) * 30;
        
        // 椭圆轨道运动
        const orbitX = Math.cos(orbitPhase) * orbitRadiusX;
        const orbitY = Math.sin(orbitPhase) * orbitRadiusY;
        
        // 添加微妙的波动，模拟寻觅时的不确定感
        const searchWiggle = Math.sin(orbitPhase * 3) * 12;
        
        targetX = orbitCenterX + orbitX + driftX + searchWiggle;
        targetY = orbitCenterY + orbitY + driftY;
        
      } else {
        const autoX = width / 2 + Math.sin(time * 0.5) * (width * 0.3);
        const autoY = height / 2 + Math.cos(time * 0.3) * (height * 0.2);
        targetX = mouse.current.active ? mouse.current.x + width / 2 : autoX;
        targetY = mouse.current.active ? mouse.current.y + height / 2 : autoY;
      }

      // Even faster interpolation for near-zero perceived latency
      const followSpeed = orbitActive ? 0.08 : 0.2; // 轨道模式下更慢更优雅
      fishPos.x += (targetX - fishPos.x) * followSpeed;
      fishPos.y += (targetY - fishPos.y) * followSpeed;

      // === 绘制主鱼和粒子（前景层）- 只在非鱼群页面 ===
      if (!showSchool) {
        ctx.save();
        
        // 更新和绘制粒子
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;

          const progress = p.life / p.maxLife;
          
          // 只绘制尾部粒子 - 极细、有光感的蓝白粒子
          if (p.color) {
            const opacity = (1 - progress) * 0.8; // 渐渐消退
            
            // 加强模糊发光效果
            ctx.filter = `blur(${p.size * 3}px)`; // 添加模糊
            
            // 强烈的发光效果（即使粒子很小也能看见）
            ctx.shadowBlur = Math.max(p.size * 15, 8); // 增强发光半径
            ctx.shadowColor = p.color + opacity + ')';
            ctx.fillStyle = p.color + opacity + ')';
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 添加更强的外光晕
            ctx.shadowBlur = Math.max(p.size * 30, 12); // 增强外光晕
            ctx.fillStyle = p.color + (opacity * 0.4) + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // 重置阴影和滤镜
            ctx.shadowBlur = 0;
            ctx.filter = 'none';
          }

          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
        
        ctx.filter = 'none'; // Reset filter
        ctx.restore();
        
        // Draw the "Fish" - 在汇聚过程中逐渐显现
        if (formationProgress > 0.2) {
          ctx.save();
          ctx.translate(fishPos.x, fishPos.y);
          const angle = Math.atan2(targetY - fishPos.y, targetX - fishPos.x);
          ctx.rotate(angle);
          ctx.scale(1.75, 1.75); // 鱼的尺寸
          
          // 鱼的不透明度随汇聚进度变化，强化实体感
          const fishOpacity = Math.min(1, (formationProgress - 0.2) / 0.8);
          ctx.globalAlpha = fishOpacity * 0.85; // 提高不透明度，增强实体感
          
          // 强化发光效果
          ctx.shadowBlur = 35;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
          
          // 鱼身 - 更有质感的白色
          ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
          
          // Elegant fish body - more fluid, stroke-like
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.bezierCurveTo(8, 7, -10, 5, -15, 0);
          ctx.bezierCurveTo(-10, -5, 8, -7, 15, 0);
          ctx.fill();
          
          // Tail with a bit of "flow" - like a brush stroke
          const tailWiggle = Math.sin(time * 8) * 4;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          
          ctx.beginPath();
          ctx.moveTo(-12, 0);
          ctx.bezierCurveTo(-18, 8 + tailWiggle, -25, 4, -20, 0);
          ctx.bezierCurveTo(-25, -4, -18, -8 + tailWiggle, -12, 0);
          ctx.closePath();
          ctx.fill();
          
          // 生成尾部粒子 - 极细的蓝白混合光粒，从身体后部开始散布
          const particleThreshold = orbitActive ? 0.3 : 0.1; // 轨道模式下更少的粒子
          if (formationProgress >= 1 && Math.random() > particleThreshold) {
            // 从身体后部到尾尖的随机位置
            const bodyTailX = -15 + Math.random() * -10; // -15 到 -25 的范围
            const bodyTailY = (Math.random() - 0.5) * 8; // 垂直方向也有分布
            
            // 转换到世界坐标
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            const scale = 1.75;
            const worldTailX = fishPos.x + (bodyTailX * scale * cosA - bodyTailY * scale * sinA);
            const worldTailY = fishPos.y + (bodyTailX * scale * sinA + bodyTailY * scale * cosA);
            
            // 轨道模式下更多蓝色，正常模式下蓝白各半
            const blueChance = orbitActive ? 0.75 : 0.5;
            const isBlue = Math.random() > (1 - blueChance);
            const particleColor = isBlue 
              ? `rgba(${100 + Math.random() * 100}, ${200 + Math.random() * 55}, 255, ` // 海蓝色
              : `rgba(${240 + Math.random() * 15}, ${245 + Math.random() * 10}, 255, `; // 白色
            
            const speedMultiplier = orbitActive ? 0.5 : 1.0; // 轨道模式下更慢
            const tp = {
              x: worldTailX + (Math.random() - 0.5) * 15, // 更大的散开范围
              y: worldTailY + (Math.random() - 0.5) * 15,
              vx: (-cosA * (0.3 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.8) * speedMultiplier,
              vy: (-sinA * (0.3 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.8) * speedMultiplier,
              life: 0,
              lifeProgress: 0,
              maxLife: orbitActive ? 80 + Math.random() * 80 : 50 + Math.random() * 50, // 轨道模式下寿命更长
              size: Math.random() * 0.5 + 0.1, // 极细 0.1-0.6
              alpha: 1,
              rotation: 0,
              rotationSpeed: 0,
              color: particleColor
            };
            particles.push(tp);
          }
          

          
          ctx.restore();
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, [showSchool]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[5]"
    />
  );
};

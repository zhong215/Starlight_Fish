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

  constructor(width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;
    
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
    this.turnSpeed = 0.012 + Math.random() * 0.02;
    
    this.hue = 200 + Math.random() * 12;
    this.isWhite = Math.random() > 0.65;
    
    this.history = [];
    this.historyLimit = 6 + Math.floor(Math.random() * 8);
    
    this.interactFactor = 0;
  }

  update(width: number, height: number, mouse: { x: number; y: number; active: boolean }, time: number) {
    const cx = width / 2;
    const cy = height / 2;
    const distToCenter = Math.hypot(this.x - cx, this.y - cy);
    const angleToCenter = Math.atan2(this.y - cy, this.x - cx);
    
    // 梵高流场核心：切线方向 + 随距离变化的向心/离心扰动
    const flowAngle = angleToCenter + Math.PI / 2 + Math.sin(distToCenter * 0.005 + time * 0.01) * 0.4;
    
    let targetAngle = flowAngle;

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
    const baseOpacity = this.isWhite ? 0.75 : 0.45;
    const lightness = this.isWhite ? 98 : 88;

    // 绘制轨迹
    for (let i = 1; i < this.history.length; i++) {
      const p1 = this.history[i - 1];
      const p2 = this.history[i];
      if (Math.abs(p1.x - p2.x) > 100 || Math.abs(p1.y - p2.y) > 100) continue;

      const ratio = 1 - (i / this.history.length);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `hsla(${this.hue}, 100%, ${lightness}%, ${baseOpacity * ratio})`;
      ctx.lineWidth = 1.4 * ratio;
      ctx.stroke();
    }

    // 绘制鱼身
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const bodyGrd = ctx.createLinearGradient(-8, 0, 5, 0);
    bodyGrd.addColorStop(0, 'transparent');
    bodyGrd.addColorStop(1, `hsla(${this.hue}, 100%, ${lightness}%, ${baseOpacity})`);
    ctx.fillStyle = bodyGrd;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
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

interface DeepSeaCanvasProps {
  externalTarget?: { x: number; y: number } | null;
  triggerDash?: boolean;
  showSchool?: boolean; // 是否显示鱼群
}

const FISH_CONFIG = {
  // === 移动与跟随 ===
  movement: {
    followSpeed: 0.2,              // 鱼跟随目标的插值系数 (0-1，越大越快)
  },
  
  // === 自动巡游模式 ===
  autoMovement: {
    horizontalPeriod: 0.5,         // 横向移动周期系数
    horizontalAmplitude: 0.3,      // 横向幅度 (画布宽度的倍数)
    verticalPeriod: 0.3,           // 纵向移动周期系数
    verticalAmplitude: 0.2,        // 纵向幅度 (画布高度的倍数)
  },
  
  // === 鱼尾摆动 ===
  tail: {
    wiggleFrequency: 8,            // 摆动频率 (Hz)
    wiggleAmplitude: 4,            // 摆动幅度 (像素)
  },
  
  // === 视觉效果 ===
  appearance: {
    opacity: 0.95,                 // 鱼身不透明度
    shadowBlur: 30,                // 发光模糊半径
    shadowOpacity: 0.8,            // 发光不透明度
    color: '#FFFFFF',              // 鱼的颜色
  },
  
  // === 尾迹粒子 ===
  trail: {
    spawnProbability: 0.85,        // 每帧生成概率 (1 - 0.15)
    jitterRange: 8,                // 生成位置抖动范围 (像素)
    baseLifetime: 200,             // 粒子基础寿命 (帧)
    lifetimeVariation: 200,        // 寿命随机变化范围 (帧)
    baseSize: 1,                   // 粒子基础大小
    sizeVariation: 4,              // 大小随机变化范围
    velocityRange: 0.1,            // 速度随机范围
    maxOpacity: 0.3,               // 粒子最大不透明度
    sizeGrowth: 2,                 // 粒子大小增长倍数
    blurMultiplier: 0.5,           // 模糊系数 (相对粒子大小)
  },
  
  // === 鱼身形状 (贝塞尔路径) ===
  bodyShape: {
    head: { x: 15, y: 0 },
    bodyCurve1: { cp1: [8, 7], cp2: [-10, 5], end: [-15, 0] },
    bodyCurve2: { cp1: [-10, -5], cp2: [8, -7], end: [15, 0] },
  },
  
  // === 鱼尾形状 (贝塞尔路径，包含动态摆动) ===
  tailShape: {
    base: { x: -12, y: 0 },
    topCurve: { cp1: [-18, 8], cp2: [-25, 4], end: [-20, 0] },  // 8 会加上 tailWiggle
    bottomCurve: { cp1: [-25, -4], cp2: [-18, -8], end: [-12, 0] }, // -8 会加上 tailWiggle
  }
};

export const DeepSeaCanvas: React.FC<DeepSeaCanvasProps> = ({ externalTarget, triggerDash, showSchool = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0, active: false });
  const target = useRef<{ x: number; y: number; z: number; prevX?: number; prevY?: number; dashTime: number }>({ 
    x: 0, y: 0, z: 0, dashTime: 0 
  });

  useEffect(() => {
    if (triggerDash) {
      target.current.dashTime = 1.0;
    }
  }, [triggerDash]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 声明所有变量
    const particles: (BokehParticle & { lifeProgress: number })[] = [];
    const FISH_COUNT = 800;
    const fishArray: MinimalFish[] = [];
    const lightParticles: LightParticle[] = [];
    const schoolMouse = { x: -1000, y: -1000, active: false };
    
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
      // 重新初始化鱼群（仅在showSchool为true时）
      if (showSchool) {
        fishArray.length = 0;
        for (let i = 0; i < FISH_COUNT; i++) {
          fishArray.push(new MinimalFish(width, height));
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX - width / 2;
      mouse.current.y = e.clientY - height / 2;
      mouse.current.active = true;
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

    let animationFrame: number;
    let time = 0;

    const render = () => {
      time += 0.016; // Approx 60fps
      
      // Background: Deep, dark, ethereal - 根据是否显示鱼群调整背景透明度
      ctx.fillStyle = showSchool ? 'rgba(2, 6, 23, 0.38)' : '#020617';
      ctx.fillRect(0, 0, width, height);

      // === 绘制鱼群（背景层）- 仅在showSchool为true时 ===
      if (showSchool) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 更新和绘制鱼群
        fishArray.forEach(fish => {
          fish.update(width, height, schoolMouse, time);
          fish.draw(ctx);
          
          // 生成光粒子
          if (fish.shouldSpawnParticle()) {
            lightParticles.push(new LightParticle(fish.x, fish.y, fish.hue));
          }
        });
        
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
      // Smooth target movement
      const followSpeed = FISH_CONFIG.movement.followSpeed;
      if (externalTarget) {
        const tx = externalTarget.x - width / 2;
        const ty = externalTarget.y - height / 2;
        target.current.x += (tx - target.current.x) * followSpeed;
        target.current.y += (ty - target.current.y) * followSpeed;
      } else if (mouse.current.active) {
        target.current.x += (mouse.current.x - target.current.x) * followSpeed;
        target.current.y += (mouse.current.y - target.current.y) * followSpeed;
      } else {
        // Auto Cruise
        const { horizontalPeriod, horizontalAmplitude, verticalPeriod, verticalAmplitude } = FISH_CONFIG.autoMovement;
        target.current.x = Math.sin(time * horizontalPeriod) * (width * horizontalAmplitude);
        target.current.y = Math.sin(time * verticalPeriod) * (height * verticalAmplitude);
      }
      
      const fishX = target.current.x + width / 2;
      const fishY = target.current.y + height / 2;

      if (target.current.dashTime > 0) target.current.dashTime -= 0.02;

      // Emit Trail Particles - 只在非鱼群页面（intro）显示主鱼拖尾
      if (!showSchool && Math.random() < FISH_CONFIG.trail.spawnProbability) {
        const { jitterRange, baseLifetime, lifetimeVariation, baseSize, sizeVariation, velocityRange } = FISH_CONFIG.trail;
        const maxLife = baseLifetime + Math.random() * lifetimeVariation;
        particles.push({
          x: fishX + (Math.random() - 0.5) * jitterRange,
          y: fishY + (Math.random() - 0.5) * jitterRange,
          size: baseSize + Math.random() * sizeVariation,
          alpha: FISH_CONFIG.trail.maxOpacity,
          vx: (Math.random() - 0.5) * velocityRange,
          vy: (Math.random() - 0.5) * velocityRange,
          life: maxLife,
          lifeProgress: 1,
          maxLife: maxLife,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02
        });
      }

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      // Draw Trail Particles - 只在非鱼群页面（intro）绘制主鱼拖尾
      if (!showSchool) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          p.lifeProgress = p.life / p.maxLife;
          
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }

          const opacity = p.alpha * p.lifeProgress;
          const currentSize = p.size * (1 + (1 - p.lifeProgress) * FISH_CONFIG.trail.sizeGrowth);

          ctx.shadowBlur = currentSize * FISH_CONFIG.trail.blurMultiplier;
          ctx.shadowColor = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // === 灵翼鱼 - 极简X翼白鱼设计 ===
      const dx = target.current.x - (target.current.prevX || 0);
      const dy = target.current.y - (target.current.prevY || 0);
      const angle = Math.atan2(dy, dx);
      target.current.prevX = target.current.x;
      target.current.prevY = target.current.y;

      ctx.translate(fishX, fishY);
      ctx.rotate(angle);

      // 翼鳍律动参数（缓慢优雅）
      const baseFreq = FISH_CONFIG.tail.wiggleFrequency * 0.4;
      const finWave1 = Math.sin(time * baseFreq * 0.65) * 4;
      const finWave2 = Math.sin(time * baseFreq * 0.42 + 1.2) * 7;
      const bodyBreathe = Math.sin(time * 0.7) * 0.018;
      
      // === 尾鳍层 - 最底层（最长、最透明）===
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.filter = 'blur(3px)';
      
      // 尾鳍分叉1 - 上分支（极长）
      const tail1Grad = ctx.createLinearGradient(-20, 0, -120, -50 + wave5);
      tail1Grad.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
      tail1Grad.addColorStop(0.3, 'rgba(80, 160, 240, 0.25)');
      tail1Grad.addColorStop(0.7, 'rgba(60, 140, 220, 0.1)');
      tail1Grad.addColorStop(1, 'rgba(40, 120, 200, 0)');
      ctx.fillStyle = tail1Grad;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.bezierCurveTo(-40, -10 + wave3, -70, -25 + wave4, -100, -40 + wave5);
      ctx.bezierCurveTo(-110, -45 + wave5, -120, -48 + wave5, -115, -35 + wave5);
      ctx.bezierCurveTo(-85, -22 + wave4, -55, -12 + wave3, -25, -5 + wave2);
      ctx.closePath();
      ctx.fill();
      
      // 尾鳍分叉2 - 下分支（极长）
      const tail2Grad = ctx.createLinearGradient(-20, 0, -120, 50 - wave5);
      tail2Grad.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
      tail2Grad.addColorStop(0.3, 'rgba(80, 160, 240, 0.25)');
      tail2Grad.addColorStop(0.7, 'rgba(60, 140, 220, 0.1)');
      tail2Grad.addColorStop(1, 'rgba(40, 120, 200, 0)');
      ctx.fillStyle = tail2Grad;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.bezierCurveTo(-40, 10 - wave3, -70, 25 - wave4, -100, 40 - wave5);
      ctx.bezierCurveTo(-110, 45 - wave5, -120, 48 - wave5, -115, 35 - wave5);
      ctx.bezierCurveTo(-85, 22 - wave4, -55, 12 - wave3, -25, 5 - wave2);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
      // === 尾鳍层 - 中层（中等透明）===
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.filter = 'blur(2px)';
      
      // 中层上分支
      const tail3Grad = ctx.createLinearGradient(-20, 0, -90, -35 + wave4);
      tail3Grad.addColorStop(0, 'rgba(120, 190, 255, 0.5)');
      tail3Grad.addColorStop(0.4, 'rgba(100, 170, 240, 0.3)');
      tail3Grad.addColorStop(1, 'rgba(70, 140, 210, 0)');
      ctx.fillStyle = tail3Grad;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.bezierCurveTo(-32, -8 + wave2, -55, -18 + wave3, -80, -30 + wave4);
      ctx.bezierCurveTo(-88, -34 + wave4, -92, -32 + wave4, -80, -22 + wave3);
      ctx.bezierCurveTo(-55, -14 + wave3, -32, -5 + wave2, -18, -2 + wave1);
      ctx.closePath();
      ctx.fill();
      
      // 中层下分支
      const tail4Grad = ctx.createLinearGradient(-20, 0, -90, 35 - wave4);
      tail4Grad.addColorStop(0, 'rgba(120, 190, 255, 0.5)');
      tail4Grad.addColorStop(0.4, 'rgba(100, 170, 240, 0.3)');
      tail4Grad.addColorStop(1, 'rgba(70, 140, 210, 0)');
      ctx.fillStyle = tail4Grad;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.bezierCurveTo(-32, 8 - wave2, -55, 18 - wave3, -80, 30 - wave4);
      ctx.bezierCurveTo(-88, 34 - wave4, -92, 32 - wave4, -80, 22 - wave3);
      ctx.bezierCurveTo(-55, 14 - wave3, -32, 5 - wave2, -18, 2 - wave1);
      ctx.closePath();
      ctx.fill();
      
      // 中央主尾
      const tail5Grad = ctx.createLinearGradient(-20, 0, -75, 0);
      tail5Grad.addColorStop(0, 'rgba(130, 200, 255, 0.6)');
      tail5Grad.addColorStop(0.5, 'rgba(100, 170, 240, 0.35)');
      tail5Grad.addColorStop(1, 'rgba(70, 140, 210, 0)');
      ctx.fillStyle = tail5Grad;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.bezierCurveTo(-35, -4 + wave2 * 0.5, -52, -6 + wave3 * 0.7, -70, -5 + wave4);
      ctx.bezierCurveTo(-75, 0 + wave4, -70, 5 + wave4, -70, 5 - wave4);
      ctx.bezierCurveTo(-52, 6 - wave3 * 0.7, -35, 4 - wave2 * 0.5, -15, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
      // === 尾鳍层 - 顶层（最清晰）===
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.filter = 'blur(1px)';
      
      const tail6Grad = ctx.createLinearGradient(-15, 0, -60, -20 + wave3);
      tail6Grad.addColorStop(0, 'rgba(150, 210, 255, 0.7)');
      tail6Grad.addColorStop(0.6, 'rgba(120, 180, 240, 0.4)');
      tail6Grad.addColorStop(1, 'rgba(90, 150, 210, 0)');
      ctx.fillStyle = tail6Grad;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.bezierCurveTo(-25, -6 + wave2, -40, -12 + wave3, -55, -18 + wave3);
      ctx.bezierCurveTo(-58, -16 + wave3, -55, -10 + wave2, -40, -8 + wave2);
      ctx.bezierCurveTo(-25, -4 + wave1, -15, -1, -12, 0);
      ctx.closePath();
      ctx.fill();
      
      const tail7Grad = ctx.createLinearGradient(-15, 0, -60, 20 - wave3);
      tail7Grad.addColorStop(0, 'rgba(150, 210, 255, 0.7)');
      tail7Grad.addColorStop(0.6, 'rgba(120, 180, 240, 0.4)');
      tail7Grad.addColorStop(1, 'rgba(90, 150, 210, 0)');
      ctx.fillStyle = tail7Grad;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.bezierCurveTo(-25, 6 - wave2, -40, 12 - wave3, -55, 18 - wave3);
      ctx.bezierCurveTo(-58, 16 - wave3, -55, 10 - wave2, -40, 8 - wave2);
      ctx.bezierCurveTo(-25, 4 - wave1, -15, 1, -12, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
      
      // === 胸鳍 - 多层飘逸 ===
      ctx.save();
      
      // 胸鳍底层（最透明、最大）
      ctx.globalAlpha = 0.2;
      ctx.filter = 'blur(3px)';
      const pectoral1Grad = ctx.createRadialGradient(5, 10, 0, 5, 10, 35);
      pectoral1Grad.addColorStop(0, 'rgba(120, 190, 255, 0.4)');
      pectoral1Grad.addColorStop(0.6, 'rgba(90, 160, 230, 0.2)');
      pectoral1Grad.addColorStop(1, 'rgba(60, 130, 200, 0)');
      ctx.fillStyle = pectoral1Grad;
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.bezierCurveTo(7, 18 - wave1 * 0.8, 3, 28 - wave2, -5, 35 - wave2);
      ctx.bezierCurveTo(-3, 30 - wave2, 2, 20 - wave1, 8, 6);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.bezierCurveTo(7, -18 + wave1 * 0.8, 3, -28 + wave2, -5, -35 + wave2);
      ctx.bezierCurveTo(-3, -30 + wave2, 2, -20 + wave1, 8, -6);
      ctx.fill();
      
      // 胸鳍中层
      ctx.globalAlpha = 0.35;
      ctx.filter = 'blur(1.5px)';
      const pectoral2Grad = ctx.createRadialGradient(6, 8, 0, 6, 8, 25);
      pectoral2Grad.addColorStop(0, 'rgba(140, 200, 255, 0.6)');
      pectoral2Grad.addColorStop(0.6, 'rgba(110, 170, 235, 0.3)');
      pectoral2Grad.addColorStop(1, 'rgba(80, 140, 210, 0)');
      ctx.fillStyle = pectoral2Grad;
      ctx.beginPath();
      ctx.moveTo(8, 5);
      ctx.bezierCurveTo(7, 14 - wave1 * 0.6, 4, 21 - wave2 * 0.8, 0, 26 - wave2);
      ctx.bezierCurveTo(2, 22 - wave2, 5, 15 - wave1, 8, 5);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.bezierCurveTo(7, -14 + wave1 * 0.6, 4, -21 + wave2 * 0.8, 0, -26 + wave2);
      ctx.bezierCurveTo(2, -22 + wave2, 5, -15 + wave1, 8, -5);
      ctx.fill();
      
      ctx.restore();
      
      // === 背鳍 - 金鱼特征（飘扬）===
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.filter = 'blur(2px)';
      const dorsalGrad = ctx.createLinearGradient(10, -15, 10, -28 + wave2);
      dorsalGrad.addColorStop(0, 'rgba(150, 210, 255, 0.7)');
      dorsalGrad.addColorStop(0.6, 'rgba(120, 180, 240, 0.4)');
      dorsalGrad.addColorStop(1, 'rgba(90, 150, 220, 0)');
      ctx.fillStyle = dorsalGrad;
      ctx.beginPath();
      ctx.moveTo(12, -12);
      ctx.bezierCurveTo(11, -20 + wave1 * 0.7, 9, -26 + wave2, 7, -30 + wave2);
      ctx.bezierCurveTo(9, -28 + wave2, 12, -22 + wave1, 14, -15);
      ctx.bezierCurveTo(13, -13, 12, -12, 12, -12);
      ctx.fill();
      
      // 背鳍高光
      ctx.globalAlpha = 0.3;
      ctx.filter = 'blur(1px)';
      ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(11, -14);
      ctx.bezierCurveTo(10, -18 + wave1 * 0.5, 9, -22 + wave2 * 0.8, 8, -25 + wave2);
      ctx.lineTo(10, -24 + wave2);
      ctx.bezierCurveTo(11, -20 + wave2 * 0.8, 12, -17 + wave1 * 0.5, 12, -14);
      ctx.fill();
      ctx.restore();
      
      // === 腹鳍 - 金鱼的可爱小鳍 ===
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.filter = 'blur(1.5px)';
      const ventralGrad = ctx.createLinearGradient(5, 12, 0, 18 + wave1);
      ventralGrad.addColorStop(0, 'rgba(140, 200, 255, 0.6)');
      ventralGrad.addColorStop(0.7, 'rgba(110, 170, 230, 0.3)');
      ventralGrad.addColorStop(1, 'rgba(80, 140, 200, 0)');
      ctx.fillStyle = ventralGrad;
      ctx.beginPath();
      ctx.moveTo(6, 12);
      ctx.bezierCurveTo(4, 15 - wave1 * 0.4, 2, 17 - wave1 * 0.6, 0, 19 - wave1);
      ctx.bezierCurveTo(1, 17 - wave1 * 0.6, 3, 14 - wave1 * 0.4, 6, 12);
      ctx.fill();
      ctx.restore();
      
      // === 身体 - 金鱼水墨晕染效果（多层叠加）===
      ctx.save();
      
      // 身体外层（最淡、最虚化 - 营造飘逸感）
      ctx.globalAlpha = 0.25;
      ctx.filter = 'blur(8px)';
      const body1Grad = ctx.createRadialGradient(12, 0, 0, 12, 0, 45);
      body1Grad.addColorStop(0, 'rgba(140, 200, 255, 0.5)');
      body1Grad.addColorStop(0.4, 'rgba(100, 170, 240, 0.3)');
      body1Grad.addColorStop(1, 'rgba(70, 140, 210, 0)');
      ctx.fillStyle = body1Grad;
      ctx.beginPath();
      // 金鱼圆润的外轮廓
      ctx.moveTo(32, 0); // 头部
      ctx.bezierCurveTo(32, -14, 22, -22, 8, -22); // 上背部弧线
      ctx.bezierCurveTo(-5, -22, -14, -16, -16, -8); // 上尾部连接
      ctx.bezierCurveTo(-18, -3, -18, 3, -16, 8); // 尾部
      ctx.bezierCurveTo(-14, 16, -5, 22, 8, 22); // 下腹部弧线
      ctx.bezierCurveTo(22, 22, 32, 14, 32, 0); // 回到头部
      ctx.fill();
      
      // 身体中层（清晰轮廓）
      ctx.globalAlpha = 0.45;
      ctx.filter = 'blur(4px)';
      const body2Grad = ctx.createRadialGradient(14, 0, 0, 14, 0, 28);
      body2Grad.addColorStop(0, 'rgba(150, 210, 255, 0.7)');
      body2Grad.addColorStop(0.5, 'rgba(120, 180, 240, 0.5)');
      body2Grad.addColorStop(1, 'rgba(90, 150, 220, 0.1)');
      ctx.fillStyle = body2Grad;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.bezierCurveTo(30, -12, 20, -19, 8, -19);
      ctx.bezierCurveTo(-3, -19, -11, -14, -13, -7);
      ctx.bezierCurveTo(-14, -2, -14, 2, -13, 7);
      ctx.bezierCurveTo(-11, 14, -3, 19, 8, 19);
      ctx.bezierCurveTo(20, 19, 30, 12, 30, 0);
      ctx.fill();
      
      // 身体核心（最清晰 - 金鱼圆润形态）
      ctx.globalAlpha = 0.75;
      ctx.filter = 'blur(1.5px)';
      const body3Grad = ctx.createRadialGradient(16, 0, 0, 16, 0, 22);
      body3Grad.addColorStop(0, 'rgba(180, 225, 255, 0.9)');
      body3Grad.addColorStop(0.4, 'rgba(150, 200, 250, 0.75)');
      body3Grad.addColorStop(0.8, 'rgba(120, 175, 240, 0.5)');
      body3Grad.addColorStop(1, 'rgba(100, 160, 230, 0.2)');
      ctx.fillStyle = body3Grad;
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(135, 206, 250, 0.6)';
      ctx.beginPath();
      // 金鱼饱满的身体
      ctx.moveTo(28, 0); // 圆润的头部
      ctx.bezierCurveTo(28, -10, 18, -17, 8, -17); // 上背部
      ctx.bezierCurveTo(0, -17, -8, -13, -10, -6); // 背鳍区域
      ctx.bezierCurveTo(-11, -3, -12, 0, -11, 3); // 尾根
      ctx.bezierCurveTo(-8, 13, 0, 17, 8, 17); // 下腹部（金鱼特征）
      ctx.bezierCurveTo(18, 17, 28, 10, 28, 0); // 回到头部
      ctx.fill();
      
      // 腹部下垂感（金鱼特有的圆鼓鼓）
      ctx.globalAlpha = 0.6;
      ctx.filter = 'blur(2px)';
      ctx.shadowBlur = 15;
      const bellyGrad = ctx.createRadialGradient(10, 8, 0, 10, 8, 12);
      bellyGrad.addColorStop(0, 'rgba(190, 230, 255, 0.7)');
      bellyGrad.addColorStop(0.6, 'rgba(160, 210, 250, 0.4)');
      bellyGrad.addColorStop(1, 'rgba(130, 190, 240, 0)');
      ctx.fillStyle = bellyGrad;
      ctx.beginPath();
      ctx.ellipse(10, 6, 12, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 背部高光（金鱼光泽感）
      ctx.globalAlpha = 0.6;
      ctx.filter = 'blur(3px)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(220, 240, 255, 0.5)';
      const highlightGrad = ctx.createLinearGradient(18, -8, 18, -2);
      highlightGrad.addColorStop(0, 'rgba(230, 245, 255, 0.8)');
      highlightGrad.addColorStop(0.5, 'rgba(200, 230, 255, 0.5)');
      highlightGrad.addColorStop(1, 'rgba(170, 215, 250, 0)');
      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.ellipse(18, -5, 10, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      
      // 头部额头高光（金鱼鼓额）
      ctx.globalAlpha = 0.5;
      ctx.filter = 'blur(2px)';
      ctx.shadowBlur = 8;
      const foreheadGrad = ctx.createRadialGradient(24, -2, 0, 24, -2, 6);
      foreheadGrad.addColorStop(0, 'rgba(240, 250, 255, 0.7)');
      foreheadGrad.addColorStop(1, 'rgba(200, 230, 255, 0)');
      ctx.fillStyle = foreheadGrad;
      ctx.beginPath();
      ctx.arc(24, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // 侧面纹理（水墨笔触感）
      ctx.globalAlpha = 0.2;
      ctx.filter = 'blur(1px)';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(100, 170, 240, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, -10);
      ctx.bezierCurveTo(10, -12, 0, -11, -8, -8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20, 10);
      ctx.bezierCurveTo(10, 12, 0, 11, -8, 8);
      ctx.stroke();
      
      ctx.restore();
      
      // === 眼睛 - 金鱼大眼睛 ===
      ctx.save();
      ctx.filter = 'none';
      ctx.globalAlpha = 0.95;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(200, 230, 255, 0.9)';
      
      // 眼白（更大）
      ctx.fillStyle = 'rgba(245, 252, 255, 0.98)';
      ctx.beginPath();
      ctx.arc(22, -4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 瞳孔外圈（金鱼特征）
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(70, 150, 230, 0.7)';
      const eyeOuterGrad = ctx.createRadialGradient(22, -4, 0, 22, -4, 2.5);
      eyeOuterGrad.addColorStop(0, 'rgba(30, 90, 160, 0.95)');
      eyeOuterGrad.addColorStop(0.6, 'rgba(60, 120, 190, 0.85)');
      eyeOuterGrad.addColorStop(1, 'rgba(100, 160, 220, 0.6)');
      ctx.fillStyle = eyeOuterGrad;
      ctx.beginPath();
      ctx.arc(22, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();
      
      // 瞳孔核心
      ctx.fillStyle = 'rgba(10, 50, 100, 0.9)';
      ctx.beginPath();
      ctx.arc(22, -4, 1.3, 0, Math.PI * 2);
      ctx.fill();
      
      // 双重高光点（更灵动）
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(22.8, -4.8, 0.8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(21.5, -3.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // === 嘴巴 - 金鱼的小嘴（O型）===
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'rgba(100, 170, 240, 0.4)';
      ctx.strokeStyle = 'rgba(140, 200, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(28, 2, 2, 0, Math.PI * 2);
      ctx.stroke();
      
      // 嘴唇高光
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(28, 2, 2.2, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
      
      ctx.restore();

      ctx.restore();

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

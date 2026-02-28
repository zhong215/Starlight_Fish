import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SnowParticlesProps {
  zIndex?: number;
}

export const SnowParticles: React.FC<SnowParticlesProps> = ({ zIndex = 6 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const bokehParticlesRef = useRef<THREE.Points | null>(null);
  const mouseRef = useRef(new THREE.Vector2(-999, -999));
  const targetMouseRef = useRef(new THREE.Vector2(-999, -999));
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current; // 保存引用用于清理

    // 初始化场景
    const scene = new THREE.Scene();
    // 降低雾效密度，让粒子更清晰可见
    scene.fog = new THREE.FogExp2(0x03070d, 0.15);
    sceneRef.current = scene;

    // 初始化相机
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 4); // 相机稍微向上，让下方粒子更远（更暗）
    camera.lookAt(0, -1, 0); // 看向稍微偏下的位置
    cameraRef.current = camera;

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // 透明背景
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 创建粒子纹理
    function createCircleTexture(blur: number = 0.5): THREE.CanvasTexture {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get 2D context');
      
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.1, 'rgba(220, 240, 255, 0.9)');
      gradient.addColorStop(0.4, `rgba(100, 160, 255, ${0.3 * blur})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(canvas);
    }

    // 创建主粒子系统
    function createParticles() {
      const count = 3500;
      const geometry = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const extra = new Float32Array(count * 3); // [speed, phase, size_mult]

      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 15;
        
        // 让粒子主要集中在下方：使用权重分布
        let yDist = Math.pow(Math.random(), 1.5); // 偏向0的分布
        pos[i * 3 + 1] = (yDist - 0.7) * 15; // 范围约 -10.5 到 +4.5
        
        pos[i * 3 + 2] = (Math.random() - 0.5) * 8;

        extra[i * 3] = 0.0005 + Math.random() * 0.0015; // 上升速度（降低至原来1/4）
        extra[i * 3 + 1] = Math.random() * Math.PI * 2; // 随机初始相位
        
        // 基于高度的尺寸倍率：y 越低（下方）粒子越小/暗
        let heightFactor = Math.max(0.2, Math.min(1.0, (pos[i * 3 + 1] + 11) / 15));
        extra[i * 3 + 2] = heightFactor * (0.5 + Math.random() * 1.5); // 尺寸倍率
      }

      const positionAttr = new THREE.BufferAttribute(pos, 3);
      positionAttr.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute('position', positionAttr);
      geometry.setAttribute('extra', new THREE.BufferAttribute(extra, 3));

      const material = new THREE.PointsMaterial({
        size: 0.05,
        map: createCircleTexture(1.0),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);
      return particles;
    }

    // 创建景深粒子
    function createBokeh() {
      const count = 150;
      const geometry = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 2] = -2 - Math.random() * 10;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      
      const material = new THREE.PointsMaterial({
        size: 0.8,
        map: createCircleTexture(0.2),
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const bokehParticles = new THREE.Points(geometry, material);
      scene.add(bokehParticles);
      return bokehParticles;
    }

    // 创建粒子
    particlesRef.current = createParticles();
    bokehParticlesRef.current = createBokeh();

    // 鼠标移动处理
    const onMouseMove = (e: MouseEvent) => {
      targetMouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        targetMouseRef.current.x = (touch.clientX / window.innerWidth) * 2 - 1;
        targetMouseRef.current.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      }
    };

    // 窗口大小调整
    const onWindowResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    // 动画循环
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      const mouse = mouseRef.current;
      const targetMouse = targetMouseRef.current;
      const particles = particlesRef.current;
      const bokehParticles = bokehParticlesRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;

      if (!particles || !bokehParticles || !camera || !renderer || !scene) return;

      // 鼠标平滑跟随
      mouse.lerp(targetMouse, 0.05);

      // 更新主粒子
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const extra = particles.geometry.attributes.extra.array as Float32Array;

      for (let i = 0; i < extra.length / 3; i++) {
        let ix = i * 3;
        let iy = i * 3 + 1;
        let iz = i * 3 + 2;

        // 1. 基础上升
        positions[iy] += extra[ix];

        // 2. 灵动位移 (噪声模拟，降低速度)
        positions[ix] += Math.cos(time * 0.5 + extra[iy]) * 0.0015;
        
        // 3. 互动逻辑：鼠标斥力
        let dx = positions[ix] - (mouse.x * 5);
        let dy = (positions[iy] - (mouse.y * 5));
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1.5) {
          let force = (1.5 - dist) * 0.02;
          positions[ix] += dx * force;
          positions[iy] += dy * force;
        }

        // 4. 边界重置（从下方重新生成）
        if (positions[iy] > 6) {
          let yDist = Math.pow(Math.random(), 1.5);
          positions[iy] = (yDist - 0.7) * 15 - 6; // 从更低的位置重生
          positions[ix] = (Math.random() - 0.5) * 15;
          positions[iz] = (Math.random() - 0.5) * 8;
          
          // 重新计算尺寸倍率（基于新的y坐标）
          let heightFactor = Math.max(0.2, Math.min(1.0, (positions[iy] + 11) / 15));
          extra[i * 3 + 2] = heightFactor * (0.5 + Math.random() * 1.5);
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // 5. 呼吸效果
      (particles.material as THREE.PointsMaterial).size = 0.04 + Math.sin(time * 2) * 0.01;
      
      // 背景光斑缓慢移动
      bokehParticles.position.y += 0.001;
      if (bokehParticles.position.y > 5) bokehParticles.position.y = -5;

      // 视角跟随（保持向上的偏移）
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
      camera.position.y += ((mouse.y * 0.5 + 1) - camera.position.y) * 0.02; // +1 保持向上偏移
      camera.lookAt(0, -1, 0); // 始终看向稍微偏下的位置

      renderer.render(scene, camera);
    }

    // 添加事件监听
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchstart', onTouchMove);
    document.addEventListener('touchmove', onTouchMove);

    // 开始动画
    animate();

    // 清理函数
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchstart', onTouchMove);
      document.removeEventListener('touchmove', onTouchMove);

      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }
      
      if (bokehParticlesRef.current) {
        bokehParticlesRef.current.geometry.dispose();
        (bokehParticlesRef.current.material as THREE.Material).dispose();
      }

      if (rendererRef.current) {
        const domElement = rendererRef.current.domElement;
        rendererRef.current.dispose();
        if (container && domElement && container.contains(domElement)) {
          container.removeChild(domElement);
        }
      }
      
      // 清空refs
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      particlesRef.current = null;
      bokehParticlesRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: zIndex
      }}
    />
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DeepSeaCanvas } from './components/DeepSeaCanvas';
import { SnowParticles } from './components/SnowParticles';
import { ProjectSection } from './components/ProjectSection';
import { PortfolioView } from './components/PortfolioView';
import { ChevronRight } from 'lucide-react';
import { useAudio } from './hooks/useAudio';

// 类型定义
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

const dialogue = [
  "你好，我是鱼。",
  "人类最直觉的感知是生活，\n而鱼的感知，源于广袤且流动的深海。",
  "在波谲云诡的洋流中，鱼需要极强的定力，保持敏锐与思考——\n穿透繁杂无序的表象，去捕捉潜藏在深处的秩序，赢取生机。",
  "在我们的生活中，\n产品正是最贴近人的“秩序”。",
  "当科技杠杆在时代中掀起巨浪，\n产品成了触达人的桥梁。",
  "我的信念，是在这场浪潮中寻找新的生机，\n通过构建系统，在技术与人文的辩证中，寻得平衡。",
  "请告诉我你的名字，\n我想和你站在一起。"
];

const projectData = [
  {
    title: "产品: 为什么而生?",
    subtitle: "集团中台自动化管报系统 0-1 设计\n——以子公司初版落地为例",
    slides: [
      {
        text: "**2025年底，我负责集团层面财务数据建模和管理报告出具。**\n\n观察到流程仍有很大标准化空间，且人需要被从重复性工作中解放出来，解放思考的空间。我开始在IDE上用Python把现有非标数据建模做抽象，实现自动化。于是选择了一家收购的子公司作为试点载体。自主研发、测试、实现全流程闭环，并且和IT部门交接了后续整个中台产品的设计。",
        image: "https://raw.githubusercontent.com/zhong215/Web/main/ETL%20Process%20for%20BIP%20Data-2026-02-24-092903.svg"
      },
      {
        text: "核心灵感来自编程语言”解耦”这个定义，也是我认为该项目最有启发性的通用思想方法。即工程的构建应该是成系统的，需要以人为中心的，进行区域的合理分割。像公司的架构一样，降低执行成本和后续维护成本。所以我在我的代码中会把每个部分单独设计程序脚本，在维护时只需要修改特定部分即可，不需要了解整体系统。",
        image: "https://raw.githubusercontent.com/zhong215/Web/main/Frame.svg"
      }
    ]
  }
];

export default function App() {
  const [view, setView] = useState<'intro' | 'project' | 'portfolio'>('intro');
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [currentProject, setCurrentProject] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fishTarget, setFishTarget] = useState<{ x: number; y: number } | null>(null);
  const [triggerDash, setTriggerDash] = useState(false);
  const { playSwipeSound, initAudio } = useAudio();
  
  // 齼群位置共享状态(用于藤蔓互动)
  const [nearbyFish, setNearbyFish] = useState<FishPosition[]>([]);
  // 藤蔓节点位置(用于鱼群吸引力场)
  const [vineNodes, setVineNodes] = useState<VineNode[]>([]);
  // 滚动交互状态(用于上升粒子系统)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFooterActive, setIsFooterActive] = useState(false);
  const [scrollDarkness, setScrollDarkness] = useState(0);
  // 裂缝交互状态(用于鱼群吸引效果)
  const [crackHovered, setCrackHovered] = useState(false);
  const [crackPosition, setCrackPosition] = useState<{ x: number; y: number } | null>(null);
  // 鱼群钻入钻出状态
  const [isDrilling, setIsDrilling] = useState(false);
  const [drillingTarget, setDrillingTarget] = useState<{ section: string; position: { x: number; y: number } } | null>(null);
  // 钻出动画状态（用于控制裂缝发光）
  const [isDrillingOut, setIsDrillingOut] = useState(false);
  
  // 手电筒交互状态(用于"要有光"章节)
  const [flashlightActive, setFlashlightActive] = useState(false);
  const [flashlightPos, setFlashlightPos] = useState<{ x: number; y: number } | null>(null);
  const flashlightPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // 更新鱼群位置的回调函数
  const updateFishPositions = useCallback((fishData: FishPosition[]) => {
    setNearbyFish(fishData);
  }, []);
  
  // 更新藤蔓节点位置的回调函数
  const updateVineNodes = useCallback((nodes: VineNode[]) => {
    setVineNodes(nodes);
  }, []);
  
  // 更新滚动进度的回调函数
  const updateScrollProgress = useCallback((progress: number, isFooter: boolean = false, darkness: number = 0) => {
    setScrollProgress(progress);
    setIsFooterActive(isFooter);
    setScrollDarkness(darkness);
  }, []);

  // 更新裂缝悬停状态的回调函数
  const handleCrackHoverChange = useCallback((isHovered: boolean, position: { x: number; y: number } | null) => {
    setCrackHovered(isHovered);
    setCrackPosition(position);
  }, []);

  // 更新手电筒位置的回调函数
  const handleFlashlightPositionChange = useCallback((position: { x: number; y: number } | null) => {
    setFlashlightPos(position);
    flashlightPosRef.current = position;
  }, []);

  // 激活/停用手电筒的回调函数
  const handleFlashlightActiveChange = useCallback((active: boolean) => {
    setFlashlightActive(active);
  }, []);

  // 处理鱼群钻入动画
  const handleDrillingStart = useCallback((targetSection: string, crackPosition: { x: number; y: number }) => {
    console.log('App: handleDrillingStart 被调用', targetSection, crackPosition);
    // 更新钻入/钻出目标位置
    setDrillingTarget({ section: targetSection, position: crackPosition });
    
    // 只在第一次调用时设置钻入状态
    setIsDrilling(prev => {
      console.log('App: isDrilling 当前值:', prev);
      if (!prev) {
        console.log('App: 开始钻入，1.9秒后触发钻出');
        // 1.9秒后重置钻入状态，确保出口位置已更新（1.5秒跳转+0.3秒延迟+0.1秒缓冲）
        setTimeout(() => {
          console.log('App: 触发钻出');
          setIsDrilling(false);
          // 开始钻出动画，裂缝发光
          setIsDrillingOut(true);
        }, 1900);
        
        // 4秒后完全重置（钻出动画2秒+额外缓冲）
        setTimeout(() => {
          console.log('App: 完全重置');
          setDrillingTarget(null);
          setIsDrillingOut(false);
        }, 4000);
        
        return true;
      }
      return prev;
    });
  }, []);

  const handleMouseEnter = (e: React.MouseEvent) => {
    playSwipeSound('up', 0.5);
    const rect = e.currentTarget.getBoundingClientRect();
    setFishTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const handleMouseLeave = () => {
    setFishTarget(null);
  };

  const nextStep = () => {
    if (step < dialogue.length - 1) {
      playSwipeSound('up', 1.2);
      setStep(step + 1);
      setTriggerDash(true);
      setTimeout(() => setTriggerDash(false), 100);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      playSwipeSound('right', 1.5);
      setIsSubmitted(true);
      setTriggerDash(true);
      setTimeout(() => setTriggerDash(false), 100);
      setTimeout(() => setShowFinal(true), 500);
    }
  };

  const handleDiveDeep = () => {
    playSwipeSound('down', 2.0);
    setIsTransitioning(true);
    setTriggerDash(true);
    setTimeout(() => setTriggerDash(false), 100);
    setTimeout(() => {
      setView('portfolio');
      setIsTransitioning(false);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-8 overflow-hidden paper-texture">
      <DeepSeaCanvas 
        externalTarget={fishTarget} 
        triggerDash={triggerDash} 
        showSchool={view === 'portfolio'}
        vineNodes={vineNodes}
        onFishUpdate={updateFishPositions}
        crackPosition={crackPosition}
        crackActive={crackHovered}
        isDrilling={isDrilling}
        drillingTarget={drillingTarget}
        flashlightPos={flashlightPos}
      />
      
      {/* Snow Particles - 粒子飘雪效果 */}
      <SnowParticles zIndex={6} />

      {/* Transition Overlay - "Find the Light" effect */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
          >
            <motion.div 
              animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-96 h-96 bg-blue-400 blur-[120px] rounded-full" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {view === 'intro' ? (
            <motion.div
              key="intro-container"
              exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-16"
            >
              {!isSubmitted ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-24"
                >
                  {/* Vertical Title/Accent */}
                  <div className="hidden md:block vertical-text text-white/5 text-[10px] tracking-[1.2em] uppercase select-none font-extralight">
                    深海之秩序 · 鱼之感知
                  </div>

                  <div className="flex flex-col items-center text-center space-y-20">
                    <div className="serif text-xl md:text-2xl font-light leading-[2.8] tracking-[0.2em] text-white/70 ink-text breathing-ink max-w-4xl whitespace-pre-line">
                      {dialogue[step]}
                    </div>

                    <div className="flex items-center">
                      {step < dialogue.length - 1 ? (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5 }}
                            onClick={nextStep}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="group relative flex items-center space-x-12 px-10 py-5 text-white/40 hover:text-white/90 transition-all duration-1000 text-[11px] tracking-[0.8em] uppercase"
                          >
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.05] rounded-full transition-all duration-1000 scale-90 group-hover:scale-100 border border-white/5 group-hover:border-white/20" />
                          <span className="relative border-b border-white/10 pb-4 group-hover:border-white/60 transition-all">
                            顺流而下
                          </span>
                          <ChevronRight size={14} className="relative group-hover:translate-x-8 transition-transform duration-1000 opacity-60 group-hover:opacity-100" />
                        </motion.button>
                      ) : (
                        <motion.form
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                          onSubmit={handleNameSubmit}
                          className="w-full max-w-md mx-auto flex flex-col items-center space-y-20"
                        >
                          <div className="relative group w-full flex justify-center">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="留下你的名字，点亮这片星辰"
                              className="w-full bg-transparent py-6 pb-8 text-2xl md:text-3xl focus:outline-none transition-all duration-1000 placeholder:text-white/35 text-white/90 serif tracking-[0.15em] text-center"
                              autoFocus
                            />
                            {/* 静态底线 - 更亮 */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-white/30" />
                            
                            {/* 交互光效 - 从中心向两端延展 - 更亮 */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 to-transparent group-focus-within:w-full transition-all duration-[1500ms] ease-out shadow-[0_0_25px_rgba(255,255,255,0.8),_0_0_40px_rgba(255,255,255,0.5)]" />
                          </div>

                          <button
                            type="submit"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="group relative px-12 py-6 overflow-visible rounded-full transition-all duration-1000"
                          >
                            {/* 底部圣光 - hover时从下向上照射 */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0 opacity-0 group-hover:h-[200%] group-hover:opacity-100 transition-all duration-1000 pointer-events-none">
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-full bg-gradient-to-t from-white/20 via-white/5 to-transparent blur-2xl" />
                            </div>

                            {/* 天人合一：背景光晕 - 模拟气的流动 */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)] blur-2xl" />
                            </div>

                            {/* 边框效果 - 更是意念的边界 */}
                            <div className="absolute inset-0 border border-white/10 rounded-full scale-100 opacity-30 group-hover:scale-110 group-hover:opacity-0 transition-all duration-700" />
                            <div className="absolute inset-0 border border-white/5 rounded-full scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-20 transition-all duration-1000 ease-out" />
                            
                            {/* 文字内容 - 增强发光 */}
                            <span 
                              className="relative z-10 text-[13px] tracking-[1.5em] font-light group-hover:tracking-[2em] transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ml-2 block text-white/50 group-hover:text-white"
                              style={{
                                textShadow: '0 0 8px rgba(255,255,255,0.3), 0 0 15px rgba(255,255,255,0.2)'
                              }}
                            >
                              <span className="group-hover:[text-shadow:0_0_20px_rgba(255,255,255,0.8),0_0_30px_rgba(255,255,255,0.5),0_0_40px_rgba(255,255,255,0.3)] transition-all duration-1000">
                                合一
                              </span>
                            </span>
                            
                            {/* 神圣光点装饰 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/0 rounded-full group-hover:bg-white/60 blur-sm shadow-[0_0_15px_white] transition-all duration-1000 scale-0 group-hover:scale-100" />
                          </button>
                        </motion.form>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                showFinal && (
                  <motion.div
                    key="final"
                    initial={{ opacity: 0, filter: "blur(15px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 4, ease: "easeOut" }}
                    className="flex flex-col items-center text-center space-y-20 max-w-3xl"
                  >
                    <div className="serif text-xl md:text-2xl font-light leading-[2.8] tracking-[0.2em] text-white/80">
                      <span className="text-white font-normal italic border-b border-white/10 pb-3 px-8">
                        {name}
                      </span>
                      <p className="mt-16 ink-text">
                        我感受到了。
                      </p>
                      <p className="text-lg md:text-xl text-white/40 mt-8 font-extralight tracking-[0.2em] leading-relaxed whitespace-pre-line">
                        我很喜欢你的名字。{"\n"}现在，我将带你穿透洋流，去见证那些被捕捉的秩序。
                      </p>
                    </div>
                    
                    <motion.button 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 140, opacity: 1 }}
                      transition={{ delay: 4, duration: 2 }}
                      onClick={handleDiveDeep}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      className="flex flex-col items-center group cursor-pointer relative"
                    >
                      {/* 垂直光线 - 更有力度 */}
                      <div className="w-[2px] bg-gradient-to-b from-white/60 via-white/30 to-transparent flex-1 group-hover:from-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all duration-1000" />
                      
                      {/* 围绕光点群 - 默认就有的细小粒子，吸引注意力 */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                        {/* 粒子1 - 若隐若现 */}
                        <div className="w-[3px] h-[3px] bg-white/25 rounded-full blur-[1px] shadow-[0_0_4px_rgba(255,255,255,0.3)] absolute -left-4 top-3 animate-pulse group-hover:bg-white/80 group-hover:shadow-[0_0_12px_white] transition-all duration-700" style={{animationDelay: '0ms', animationDuration: '4s'}} />
                        
                        {/* 粒子2 */}
                        <div className="w-[2px] h-[2px] bg-white/20 rounded-full blur-[1px] shadow-[0_0_3px_rgba(255,255,255,0.2)] absolute left-4 top-7 animate-pulse group-hover:bg-white/70 group-hover:shadow-[0_0_10px_white] transition-all duration-700" style={{animationDelay: '600ms', animationDuration: '3.5s'}} />
                        
                        {/* 粒子3 */}
                        <div className="w-[2.5px] h-[2.5px] bg-white/22 rounded-full blur-[1px] shadow-[0_0_3px_rgba(255,255,255,0.25)] absolute -left-3 top-12 animate-pulse group-hover:bg-white/75 group-hover:shadow-[0_0_11px_white] transition-all duration-700" style={{animationDelay: '1200ms', animationDuration: '3.8s'}} />
                        
                        {/* 粒子4 */}
                        <div className="w-[2px] h-[2px] bg-white/18 rounded-full blur-[1px] shadow-[0_0_2px_rgba(255,255,255,0.2)] absolute left-3 top-16 animate-pulse group-hover:bg-white/65 group-hover:shadow-[0_0_9px_white] transition-all duration-700" style={{animationDelay: '1800ms', animationDuration: '4.2s'}} />
                        
                        {/* 粒子5 - 更细小 */}
                        <div className="w-[1.5px] h-[1.5px] bg-white/15 rounded-full blur-[0.5px] shadow-[0_0_2px_rgba(255,255,255,0.15)] absolute -left-1 top-20 animate-pulse group-hover:bg-white/60 group-hover:shadow-[0_0_8px_white] transition-all duration-700" style={{animationDelay: '2400ms', animationDuration: '3.2s'}} />
                        
                        {/* 粒子6 */}
                        <div className="w-[2px] h-[2px] bg-white/16 rounded-full blur-[1px] shadow-[0_0_2px_rgba(255,255,255,0.18)] absolute left-2 top-24 animate-pulse group-hover:bg-white/68 group-hover:shadow-[0_0_9px_white] transition-all duration-700" style={{animationDelay: '3000ms', animationDuration: '3.6s'}} />
                      </div>
                      
                      {/* 文字 - 更明显更优雅 */}
                      <div className="mt-8 relative">
                        <p className="text-sm tracking-[0.8em] text-white/50 group-hover:text-white/95 group-hover:tracking-[1.2em] transition-all duration-1000 font-light relative z-10 ml-3">
                          寻找光
                        </p>
                        {/* 文字背后的光晕 */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 blur-xl rounded-full scale-150 transition-all duration-1000" />
                      </div>
                    </motion.button>
                  </motion.div>
                )
              )}
            </motion.div>
          ) : view === 'project' ? (
            <motion.div
              key={`project-${currentProject}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="w-full"
            >
              <ProjectSection 
                title={projectData[currentProject].title}
                subtitle={projectData[currentProject].subtitle}
                slides={projectData[currentProject].slides}
              />
              
              {/* Project Navigation */}
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-12 z-50">
                <button 
                  onClick={() => setView('intro')}
                  className="text-[9px] tracking-[0.6em] uppercase text-white/20 hover:text-white/60 transition-all duration-700 border-b border-white/0 hover:border-white/20 pb-1"
                >
                  返回起点
                </button>
                {projectData.length > 1 && (
                  <div className="h-px w-8 bg-white/5" />
                )}
                {currentProject < projectData.length - 1 && (
                  <button 
                    onClick={() => setCurrentProject(prev => prev + 1)}
                    className="text-[9px] tracking-[0.6em] uppercase text-white/20 hover:text-white/60 transition-all duration-700 border-b border-white/0 hover:border-white/20 pb-1"
                  >
                    下一个秩序
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <PortfolioView 
              key="portfolio" 
              userName={name} 
              onBack={() => setView('intro')}
              nearbyFish={nearbyFish}
              onVineNodesUpdate={updateVineNodes}
              onScrollProgressChange={updateScrollProgress}
              onCrackHoverChange={handleCrackHoverChange}
              onDrillingStart={handleDrillingStart}
              drillingTarget={drillingTarget}
              isDrillingOut={isDrillingOut}
              flashlightActive={flashlightActive}
              flashlightPos={flashlightPos}
              onFlashlightPositionChange={handleFlashlightPositionChange}
              onFlashlightActiveChange={handleFlashlightActiveChange}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Aesthetic Overlays */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="fixed inset-0 pointer-events-none z-40 bg-radial-gradient from-transparent via-transparent to-black/40" />
    </div>
  );
}

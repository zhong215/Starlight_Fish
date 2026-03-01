import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowDown } from 'lucide-react';
import Markdown from 'react-markdown';
import { MonumentFlowchart } from './MonumentFlowchart';

interface Slide {
  text: string;
  image: string;
}

interface ProjectSectionProps {
  title: string;
  subtitle: string;
  slides: Slide[];
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({ title, subtitle, slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    const next = currentSlide + newDirection;
    if (next >= 0 && next < slides.length) {
      setDirection(newDirection);
      setCurrentSlide(next);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 400 : -400,
      opacity: 0,
      scale: 0.95,
      filter: "blur(20px)",
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      zIndex: 0,
      y: direction < 0 ? 400 : -400,
      opacity: 0,
      scale: 0.95,
      filter: "blur(20px)",
    }),
  };

  return (
    <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-4 pt-40 flex flex-col items-center justify-center min-h-[88vh] perspective-2000">
      {/* Header Info - Refined for better breathing room */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 space-y-5"
      >
        <h2 className="serif text-xl md:text-2xl lg:text-3xl text-white/70 tracking-[0.6em] leading-tight ink-text uppercase font-extralight">
          {title}
        </h2>
        <div className="flex items-center justify-center space-x-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <p className="serif text-[10px] md:text-xs text-white/20 tracking-[0.4em] italic font-extralight uppercase">
            {subtitle}
          </p>
          <div className="h-px w-16 bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
      </motion.div>

      {/* Slide Container - Balanced visual center */}
      <div className="relative w-full max-w-6xl aspect-[16/10] md:aspect-[21/9] flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 150, damping: 25 },
              opacity: { duration: 1 },
              scale: { duration: 1 },
              filter: { duration: 1 }
            }}
            className="absolute inset-0 flex flex-col lg:flex-row items-stretch bg-white/[0.01] backdrop-blur-[60px] rounded-[4rem] border border-white/5 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Text Side - Elegant typography and generous padding */}
            <div className="lg:w-1/2 p-12 md:p-20 lg:p-24 flex flex-col justify-center space-y-10 order-2 lg:order-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                <div className="flex items-center space-x-6">
                  <span className="text-[10px] font-mono text-white/10 tracking-[0.5em] uppercase">Step 0{currentSlide + 1}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                </div>
                <div className="markdown-body serif text-sm md:text-base lg:text-lg text-white/50 leading-[2.5] tracking-[0.15em] font-extralight ink-text">
                  <Markdown>{slides[currentSlide].text}</Markdown>
                </div>
              </div>
              
              <div className="pt-8 flex items-center space-x-8">
                <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-white/10 bg-white/[0.01] transition-all duration-700 hover:border-white/20 hover:text-white/30">
                  <ArrowDown size={16} className="animate-bounce" />
                </div>
                <span className="text-[9px] tracking-[0.8em] uppercase text-white/10 font-light">寻找光</span>
              </div>
            </div>

            {/* Image Side - Interactive Monument Valley Flowchart */}
            <div className="lg:w-1/2 relative overflow-hidden order-1 lg:order-2 bg-black/20 flex items-center justify-center border-l border-white/5">
              {/* Progress Indicator - Positioned on image border */}
              <div className="absolute top-8 right-8 flex items-center space-x-8 z-10">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > currentSlide ? 1 : -1);
                      setCurrentSlide(i);
                    }}
                    className="group flex flex-col items-center space-y-3"
                  >
                    <span className={`text-sm md:text-base font-mono transition-colors duration-1000 ${i === currentSlide ? 'text-white/60' : 'text-white/10 group-hover:text-white/30'}`}>
                      0{i + 1}
                    </span>
                    <div className={`h-px transition-all duration-1000 rounded-full ${i === currentSlide ? 'w-12 bg-white/40' : 'w-4 bg-white/10 group-hover:bg-white/20'}`} />
                  </button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.5 }}
                className="w-full h-full"
              >
                <MonumentFlowchart phase={currentSlide} />
              </motion.div>
              
              {/* Subtle overlay to blend with the text side */}
              <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Minimal and floating */}
        <div className="absolute -left-28 top-1/2 -translate-y-1/2 hidden xl:block">
          <button
            onClick={() => paginate(-1)}
            disabled={currentSlide === 0}
            className={`p-8 rounded-full border border-white/5 transition-all duration-1000 ${
              currentSlide === 0 ? 'opacity-0 cursor-default' : 'hover:bg-white/5 hover:border-white/10 text-white/5 hover:text-white/20'
            }`}
          >
            <ChevronLeft size={32} />
          </button>
        </div>
        <div className="absolute -right-28 top-1/2 -translate-y-1/2 hidden xl:block">
          <button
            onClick={() => paginate(1)}
            disabled={currentSlide === slides.length - 1}
            className={`p-8 rounded-full border border-white/5 transition-all duration-1000 ${
              currentSlide === slides.length - 1 ? 'opacity-0 cursor-default' : 'hover:bg-white/5 hover:border-white/10 text-white/5 hover:text-white/20'
            }`}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    </div>
  );
};

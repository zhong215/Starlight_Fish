import { useEffect, useRef, useState } from 'react';

export const useAudioEffects = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    const handleInteraction = () => {
      initAudio();
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      // Play ambient sound if not already playing and not muted
      if (!ambientNodeRef.current && !isMuted) {
        playAmbient();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [isMuted]);

  const playAmbient = () => {
    if (!audioCtxRef.current || isMuted) return;
    
    // Create a synthesized ethereal sea water sound using noise and filters
    const bufferSize = audioCtxRef.current.sampleRate * 5; // 5 seconds
    const buffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = audioCtxRef.current.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = audioCtxRef.current.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Deep rumble

    const lfo = audioCtxRef.current.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow wave
    const lfoGain = audioCtxRef.current.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gainNode = audioCtxRef.current.createGain();
    gainNode.gain.value = 0.05; // Very quiet

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    noiseSource.start();
    ambientNodeRef.current = noiseSource;
  };

  const playSwipeSound = (velocity: number) => {
    if (!audioCtxRef.current || isMuted) return;

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Glass Harmonica / Celesta synthesis
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    
    // Base frequency around 800Hz, modulated by velocity
    const baseFreq = 800;
    const pitchShift = Math.max(-200, Math.min(200, velocity * 10)); // Pitch shifts up or down based on scroll speed/direction
    osc.frequency.setValueAtTime(baseFreq + pitchShift, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + pitchShift * 1.5, ctx.currentTime + 0.5);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    // Highpass filter for celesta feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);

    // Wind Chime layer (higher frequency, shorter decay)
    if (Math.abs(velocity) > 5) {
      const chimeOsc = ctx.createOscillator();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(2000 + Math.random() * 1000, ctx.currentTime);
      
      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0, ctx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);

      chimeOsc.start();
      chimeOsc.stop(ctx.currentTime + 0.5);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now();
      const currentScrollY = window.scrollY;
      
      if (lastScrollTime.current !== 0) {
        const dt = now - lastScrollTime.current;
        const dy = currentScrollY - lastScrollY.current;
        const velocity = dy / dt; // pixels per ms

        if (Math.abs(velocity) > 0.5) { // Threshold to avoid triggering on tiny scrolls
          playSwipeSound(velocity);
        }
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = now;
    };

    // Throttle scroll event
    let timeoutId: number | null = null;
    const throttledScroll = () => {
      if (timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          handleScroll();
          timeoutId = null;
        }, 50); // 50ms throttle
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted && ambientNodeRef.current) {
        ambientNodeRef.current.stop();
        ambientNodeRef.current = null;
      } else if (!newMuted && !ambientNodeRef.current) {
        playAmbient();
      }
      return newMuted;
    });
  };

  return { isMuted, toggleMute };
};

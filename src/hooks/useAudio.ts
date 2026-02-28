import { useEffect, useRef, useCallback } from 'react';

export function useAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Background Ambient: Ethereal Sea
    const bgGain = ctx.createGain();
    bgGain.gain.value = 0; // Start silent, fade in
    bgGain.connect(ctx.destination);
    bgGainRef.current = bgGain;

    // Create brown noise for sea waves
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Lowpass filter for the sea sound
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;

    // LFO to modulate the lowpass filter (waves crashing)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // ~12.5 seconds per wave
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 350; // Modulation depth
    
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    noiseSource.connect(lowpass);
    lowpass.connect(bgGain);

    // Ethereal drone (sine wave)
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 110; // A2
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.03;
    drone.connect(droneGain);
    droneGain.connect(bgGain);

    // Second drone for harmony
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 164.81; // E3
    const droneGain2 = ctx.createGain();
    droneGain2.gain.value = 0.02;
    drone2.connect(droneGain2);
    droneGain2.connect(bgGain);

    noiseSource.start();
    lfo.start();
    drone.start();
    drone2.start();

    // Fade in
    bgGain.gain.setTargetAtTime(0.15, ctx.currentTime, 3);
  }, []);

  const playSwipeSound = useCallback((direction: 'up' | 'down' | 'left' | 'right' = 'up', speed: number = 1) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    // Master gain for the effect
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.3; // Softer overall
    masterGain.connect(ctx.destination);

    // Ethereal Glass / Celesta core
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Bandpass filter to make it ethereal and resonant, removing harsh highs
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600; // Slightly higher for a lighter feel
    filter.Q.value = 1.5; // Gentle resonance

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(masterGain);

    // Pitch based on direction - ethereal mid-high range
    let baseFreq = 523.25; // C5
    if (direction === 'down' || direction === 'right') {
      baseFreq = 392.00; // G4
    }
    
    // Pitch modulation (slow, ethereal slide)
    const slideAmount = direction === 'up' || direction === 'left' ? 20 : -20;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    // Slower, smoother glide
    osc.frequency.exponentialRampToValueAtTime(baseFreq + slideAmount * speed, ctx.currentTime + 1.5);

    // Envelope for Glass Harmonica (very soft attack, long ethereal decay)
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3); // Soft attack
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5); // Long decay

    osc.type = 'sine'; // Pure tone
    osc.start();
    osc.stop(ctx.currentTime + 2.5);

    // Wind Chime shatter (stardust) - make it much softer and lower
    const numChimes = 3; // Fewer chimes
    for (let i = 0; i < numChimes; i++) {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      
      // Lowpass for chimes to remove sharpness
      const chimeFilter = ctx.createBiquadFilter();
      chimeFilter.type = 'lowpass';
      chimeFilter.frequency.value = 1500;

      chimeOsc.connect(chimeGain);
      chimeGain.connect(chimeFilter);
      chimeFilter.connect(masterGain);

      // Random frequencies, but lower than before
      const chimeFreq = 1000 + Math.random() * 800;
      const startTime = ctx.currentTime + 0.1 + (i * 0.15) + (Math.random() * 0.05);
      
      chimeOsc.frequency.setValueAtTime(chimeFreq, startTime);
      
      chimeGain.gain.setValueAtTime(0, startTime);
      chimeGain.gain.linearRampToValueAtTime(0.01, startTime + 0.05); // Very soft
      chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      chimeOsc.type = 'sine'; // Sine instead of triangle for softer sound
      chimeOsc.start(startTime);
      chimeOsc.stop(startTime + 0.8);
    }
  }, []);

  // Ensure audio context is resumed on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioCtxRef.current) {
        initAudio();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudio]);

  return { playSwipeSound, initAudio };
}

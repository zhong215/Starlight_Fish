class AudioManager {
  private ctx: AudioContext | null = null;
  private oceanGain: GainNode | null = null;
  public isMuted: boolean = false;
  private initialized: boolean = false;
  
  // 新增：鲸鱼音频管理
  private whaleAudioCount = 4; // 4个音频文件
  private currentWhaleAudio: HTMLAudioElement | null = null;
  private whaleMediaSource: MediaElementAudioSourceNode | null = null;
  private whaleGainNode: GainNode | null = null;
  private whaleFilterNode: BiquadFilterNode | null = null;
  private whaleConvolver: ConvolverNode | null = null;

  init() {
    if (this.initialized) {
      console.log('AudioManager already initialized');
      return;
    }
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext created, state:', this.ctx.state);
      this.startOceanSound();
      this.initWhaleEffects();
      this.initialized = true;
      console.log('AudioManager initialized successfully');
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  // 初始化鲸鱼音效处理链
  private initWhaleEffects() {
    if (!this.ctx) return;

    // 创建混响效果（模拟海洋深处的反射）
    this.whaleConvolver = this.ctx.createConvolver();
    const reverbBuffer = this.createReverbBuffer();
    this.whaleConvolver.buffer = reverbBuffer;

    // 创建低通滤波器（营造水下效果）
    this.whaleFilterNode = this.ctx.createBiquadFilter();
    this.whaleFilterNode.type = 'lowpass';
    this.whaleFilterNode.frequency.value = 3000; // 保留低频到中频
    this.whaleFilterNode.Q.value = 0.7; // 温和的滤波

    // 创建增益节点
    this.whaleGainNode = this.ctx.createGain();
    this.whaleGainNode.gain.value = 1.3; // 提升音量
  }

  // 创建混响缓冲区
  private createReverbBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2; // 2秒混响
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // 指数衰减的白噪声
        const decay = Math.exp(-i / (sampleRate * 0.8));
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    return impulse;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    
    // 海洋音效静音
    if (this.oceanGain && this.ctx) {
      this.oceanGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.1, this.ctx.currentTime, 0.5);
    }
    
    // 鲸鱼音效静音
    if (this.whaleGainNode && this.ctx) {
      this.whaleGainNode.gain.setTargetAtTime(this.isMuted ? 0 : 1.3, this.ctx.currentTime, 0.1);
    }
    
    console.log('Audio muted:', this.isMuted);
    return this.isMuted;
  }

  private startOceanSound() {
    if (!this.ctx) return;
    
    // Create brown noise for ocean waves
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // compensate gain
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to make it sound like underwater/deep sea
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    // LFO for wave swelling
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // Very slow wave

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.value = this.isMuted ? 0 : 0.1;

    noise.connect(filter);
    filter.connect(this.oceanGain);
    this.oceanGain.connect(this.ctx.destination);

    noise.start();
    lfo.start();

    // Add a deep drone for mystery
    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 65; // Low C
    
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.025;
    
    // Slow drone pulse
    const droneLfo = this.ctx.createOscillator();
    droneLfo.type = 'sine';
    droneLfo.frequency.value = 0.05;
    const droneLfoGain = this.ctx.createGain();
    droneLfoGain.gain.value = 0.015;
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneGain.gain);

    drone.connect(droneGain);
    droneGain.connect(this.oceanGain);
    drone.start();
    droneLfo.start();
  }

  playHoverSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Ethereal bubble/ping
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  playSlideInSound() {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Deep resonant sweep for sections sliding in
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 1.5);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 2);
  }

  // 修改：使用真实音频文件播放鲸鱼叫声，并添加音频效果
  playWhaleCall(options?: { onStart?: () => void }): Promise<void> {
    console.log('playWhaleCall called, isMuted:', this.isMuted, 'initialized:', this.initialized);
    const { onStart } = options ?? {};
    
    if (this.isMuted) {
      console.log('Audio is muted, skipping whale call');
      return Promise.resolve();
    }

    // 确保 AudioContext 处于运行状态
    if (this.ctx && this.ctx.state === 'suspended') {
      console.log('Resuming suspended AudioContext...');
      this.ctx.resume();
    }

    // 确保音效链已初始化
    if (!this.whaleGainNode || !this.whaleFilterNode || !this.whaleConvolver) {
      console.log('Whale effects not initialized, initializing now...');
      this.initWhaleEffects();
    }

    try {
      // 停止当前正在播放的鲸鱼音效
      if (this.currentWhaleAudio) {
        console.log('Stopping previous whale audio');
        this.currentWhaleAudio.pause();
        this.currentWhaleAudio.currentTime = 0;
      }

      // 随机选择一个音频文件
      const randomIndex = Math.floor(Math.random() * this.whaleAudioCount) + 1;
      const audioPath = `/sounds/whale/whale-call-${randomIndex}.mp3`;
      
      console.log(`Creating Audio instance for: ${audioPath}`);
      
      // 创建新的 Audio 实例
      this.currentWhaleAudio = new Audio(audioPath);
      this.currentWhaleAudio.volume = 0.95; // 提升基础音量
      
      // 如果还没有创建媒体源，则创建并连接到音频效果链
      if (!this.whaleMediaSource && this.ctx && this.whaleGainNode && this.whaleFilterNode && this.whaleConvolver) {
        console.log('Creating media element source and connecting effects chain');
        
        // 创建媒体元素源
        this.whaleMediaSource = this.ctx.createMediaElementSource(this.currentWhaleAudio);
        
        // 创建干湿混合节点（控制混响量）
        const dryGain = this.ctx.createGain();
        const wetGain = this.ctx.createGain();
        dryGain.gain.value = 0.7; // 70% 原始声音
        wetGain.gain.value = 0.3; // 30% 混响
        
        // 连接音频效果链：
        // 源 -> 滤波器 -> 分成干声和湿声
        // 干声 -> 增益 -> 输出
        // 湿声 -> 混响 -> 增益 -> 输出
        this.whaleMediaSource.connect(this.whaleFilterNode);
        
        // 干声路径
        this.whaleFilterNode.connect(dryGain);
        dryGain.connect(this.whaleGainNode);
        
        // 湿声路径（混响）
        this.whaleFilterNode.connect(this.whaleConvolver);
        this.whaleConvolver.connect(wetGain);
        wetGain.connect(this.whaleGainNode);
        
        // 最终输出
        this.whaleGainNode.connect(this.ctx.destination);
      } else if (this.whaleMediaSource && this.currentWhaleAudio) {
        // 如果媒体源已存在，需要为新的 Audio 元素重新创建
        // 断开旧连接
        this.whaleMediaSource.disconnect();
        
        // 为新的 Audio 元素创建新的媒体源
        if (this.ctx && this.whaleGainNode && this.whaleFilterNode && this.whaleConvolver) {
          this.whaleMediaSource = this.ctx.createMediaElementSource(this.currentWhaleAudio);
          
          // 重新连接效果链
          const dryGain = this.ctx.createGain();
          const wetGain = this.ctx.createGain();
          dryGain.gain.value = 0.7;
          wetGain.gain.value = 0.3;
          
          this.whaleMediaSource.connect(this.whaleFilterNode);
          this.whaleFilterNode.connect(dryGain);
          dryGain.connect(this.whaleGainNode);
          this.whaleFilterNode.connect(this.whaleConvolver);
          this.whaleConvolver.connect(wetGain);
          wetGain.connect(this.whaleGainNode);
          this.whaleGainNode.connect(this.ctx.destination);
        }
      }
      
      // 添加事件监听器以便调试
      this.currentWhaleAudio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });
      
      this.currentWhaleAudio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded, duration:', this.currentWhaleAudio?.duration);
      });
      
      this.currentWhaleAudio.addEventListener('canplay', () => {
        console.log('Audio can play');
      });
      
      this.currentWhaleAudio.addEventListener('error', (e) => {
        console.error('Audio error event:', e);
      });
      
      // 播放并返回Promise，在音频结束时resolve
      console.log('Calling play()...');
      return new Promise((resolve, reject) => {
        if (!this.currentWhaleAudio) {
          reject(new Error('Audio element not created'));
          return;
        }

        let hasStarted = false;
        const handleStart = () => {
          if (hasStarted) return;
          hasStarted = true;
          console.log('Audio is now playing');
          onStart?.();
        };

        // 监听音频播放开始事件
        this.currentWhaleAudio.addEventListener('playing', handleStart, { once: true });

        // 监听音频播放结束事件
        this.currentWhaleAudio.addEventListener('ended', () => {
          console.log('✓ Whale audio playback ended');
          resolve();
        }, { once: true });

        // 监听播放错误
        this.currentWhaleAudio.addEventListener('error', (e) => {
          console.error('✗ Whale audio playback error:', e);
          reject(e);
        }, { once: true });

        // 开始播放
        this.currentWhaleAudio.play()
          .then(() => {
            console.log('✓ Whale audio play() promise resolved successfully');
          })
          .catch(e => {
            console.error('✗ Whale audio play() promise rejected:', e);
            reject(e);
          });
      });
    } catch (e) {
      console.error('✗ Error in playWhaleCall:', e);
      return Promise.reject(e);
    }
  }
}

export const audioManager = new AudioManager();

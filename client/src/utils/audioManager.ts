class AudioManager {
  private static instance: AudioManager;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;
  private isMusicEnabled: boolean = true;
  private isSfxEnabled: boolean = true;

  private constructor() {
    this.preloadAudio();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private preloadAudio(): void {
    // Preload all audio files
    const audioFiles = {
      click: '/audio/computer-mouse-click-02-383961.mp3',
      theme: '/audio/Sequence 1.mp3',
      gameTheme: '/audio/campusexplorertheme.wav',
      shine: '/audio/shine-6-268910.mp3',
      uiHover: '/audio/ui-sounds-pack-3-7-359721.mp3'
    };

    Object.entries(audioFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = key === 'theme' || key === 'gameTheme' ? this.musicVolume : this.sfxVolume;
      this.audioCache.set(key, audio);
    });

    // Set up background music
    const themeAudio = this.audioCache.get('theme');
    if (themeAudio) {
      themeAudio.loop = true;
      this.backgroundMusic = themeAudio;
    }
    
    // Set up game music
    const gameThemeAudio = this.audioCache.get('gameTheme');
    if (gameThemeAudio) {
      gameThemeAudio.loop = false; // Don't loop, we'll restart it for each round
    }
  }

  // Play sound effects
  public playClick(): void {
    if (!this.isSfxEnabled) return;
    this.playSound('click');
  }

  public playHover(): void {
    if (!this.isSfxEnabled) return;
    this.playSound('uiHover');
  }

  public playShine(): void {
    if (!this.isSfxEnabled) return;
    this.playSound('shine');
  }

  // Background music controls
  public startBackgroundMusic(): void {
    if (!this.isMusicEnabled || !this.backgroundMusic) return;
    
    this.backgroundMusic.currentTime = 0;
    const playPromise = this.backgroundMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Background music autoplay prevented:', error);
      });
    }
  }

  // Game music controls (for in-game rounds)
  public startGameMusic(): void {
    if (!this.isMusicEnabled) return;
    
    const gameThemeAudio = this.audioCache.get('gameTheme');
    if (gameThemeAudio) {
      gameThemeAudio.currentTime = 0;
      gameThemeAudio.volume = this.musicVolume;
      const playPromise = gameThemeAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Game music play failed:', error);
        });
      }
    }
  }

  public stopGameMusic(): void {
    const gameThemeAudio = this.audioCache.get('gameTheme');
    if (gameThemeAudio) {
      gameThemeAudio.pause();
      gameThemeAudio.currentTime = 0;
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  public pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  public resumeBackgroundMusic(): void {
    if (!this.isMusicEnabled || !this.backgroundMusic) return;
    
    const playPromise = this.backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log('Background music resume failed:', error);
      });
    }
  }

  // Private helper method
  private playSound(key: string): void {
    const audio = this.audioCache.get(key);
    if (audio) {
      // Clone the audio to allow overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = this.sfxVolume;
      const playPromise = audioClone.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log(`Audio play failed for ${key}:`, error);
        });
      }
    }
  }

  // Volume controls
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
    // Store in localStorage
    localStorage.setItem('musicVolume', this.musicVolume.toString());
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update cached audio volumes
    this.audioCache.forEach((audio, key) => {
      if (key !== 'theme') {
        audio.volume = this.sfxVolume;
      }
    });
    // Store in localStorage
    localStorage.setItem('sfxVolume', this.sfxVolume.toString());
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  // Enable/disable controls
  public setMusicEnabled(enabled: boolean): void {
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    localStorage.setItem('musicEnabled', enabled.toString());
  }

  public setSfxEnabled(enabled: boolean): void {
    this.isSfxEnabled = enabled;
    localStorage.setItem('sfxEnabled', enabled.toString());
  }

  public isMusicEnabledState(): boolean {
    return this.isMusicEnabled;
  }

  public isSfxEnabledState(): boolean {
    return this.isSfxEnabled;
  }

  // Initialize from localStorage
  public initializeFromStorage(): void {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSfxVolume = localStorage.getItem('sfxVolume');
    const savedMusicEnabled = localStorage.getItem('musicEnabled');
    const savedSfxEnabled = localStorage.getItem('sfxEnabled');

    if (savedMusicVolume) {
      this.setMusicVolume(parseFloat(savedMusicVolume));
    }
    if (savedSfxVolume) {
      this.setSfxVolume(parseFloat(savedSfxVolume));
    }
    if (savedMusicEnabled !== null) {
      this.isMusicEnabled = savedMusicEnabled === 'true';
    }
    if (savedSfxEnabled !== null) {
      this.isSfxEnabled = savedSfxEnabled === 'true';
    }
  }

  // User interaction required for autoplay
  public enableAudioContext(): void {
    // This should be called on first user interaction
    // Background music will start automatically if enabled
    if (this.isMusicEnabled && this.backgroundMusic) {
      this.startBackgroundMusic();
    }
  }
}

export default AudioManager;
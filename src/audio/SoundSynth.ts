/**
 * Web Audio API Sound Synthesizer.
 * Generates all classic Diablo sound effects and dark ambient drones procedurally.
 * Zero external audio assets required.
 */

export class SoundSynth {
  private ctx: AudioContext | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Weapon swing whoosh sound.
   */
  public playSwing() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Blade hitting monster - produces punchy impact and monster pain noises.
   */
  public playHitFlesh(monsterType: 'skeleton' | 'zombie' | 'butcher' = 'zombie') {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Meaty physical weapon impact (punchy low-mid thud)
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impactOsc.type = 'triangle';
    impactOsc.frequency.setValueAtTime(260, t);
    impactOsc.frequency.exponentialRampToValueAtTime(50, t + 0.12);

    impactGain.gain.setValueAtTime(0.6, t);
    impactGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    impactOsc.connect(impactGain);
    impactGain.connect(this.ctx.destination);
    impactOsc.start(t);
    impactOsc.stop(t + 0.13);

    // 2. High-frequency slicing/slapping transient pop
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sawtooth';
    snapOsc.frequency.setValueAtTime(800, t);
    snapOsc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

    snapGain.gain.setValueAtTime(0.35, t);
    snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.06);

    // 3. Monster Pain Voice & Reaction
    if (monsterType === 'skeleton') {
      // Brittle bone clatter / hollow skull strike
      const boneOsc = this.ctx.createOscillator();
      const boneGain = this.ctx.createGain();
      boneOsc.type = 'square';
      boneOsc.frequency.setValueAtTime(1200, t);
      boneOsc.frequency.exponentialRampToValueAtTime(450, t + 0.16);

      boneGain.gain.setValueAtTime(0.4, t);
      boneGain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      boneOsc.connect(boneGain);
      boneGain.connect(this.ctx.destination);
      boneOsc.start(t);
      boneOsc.stop(t + 0.17);
    } else if (monsterType === 'zombie') {
      // Undead guttural pain groan ("Uuurgh!")
      const groanOsc = this.ctx.createOscillator();
      const groanGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      groanOsc.type = 'sawtooth';
      groanOsc.frequency.setValueAtTime(110, t + 0.02);
      groanOsc.frequency.linearRampToValueAtTime(75, t + 0.22);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, t + 0.02);
      filter.frequency.linearRampToValueAtTime(160, t + 0.22);
      filter.Q.setValueAtTime(3.0, t);

      groanGain.gain.setValueAtTime(0.0, t);
      groanGain.gain.linearRampToValueAtTime(0.55, t + 0.05);
      groanGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      groanOsc.connect(filter);
      filter.connect(groanGain);
      groanGain.connect(this.ctx.destination);
      groanOsc.start(t + 0.02);
      groanOsc.stop(t + 0.23);
    } else if (monsterType === 'butcher') {
      // Demonic enraged grunt ("Hrrrooomph!")
      const roarOsc = this.ctx.createOscillator();
      const roarGain = this.ctx.createGain();
      roarOsc.type = 'sawtooth';
      roarOsc.frequency.setValueAtTime(90, t);
      roarOsc.frequency.exponentialRampToValueAtTime(40, t + 0.28);

      roarGain.gain.setValueAtTime(0.65, t);
      roarGain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

      roarOsc.connect(roarGain);
      roarGain.connect(this.ctx.destination);
      roarOsc.start(t);
      roarOsc.stop(t + 0.29);
    }
  }

  /**
   * Shield metallic deflection block sound.
   */
  public playBlock() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  /**
   * Monster death crunch / bone collapse.
   */
  public playMonsterDeath(monsterType: 'skeleton' | 'zombie' | 'butcher' = 'zombie') {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (monsterType === 'skeleton') {
      // Multiple bone fragments shattering
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800 - i * 180, t + i * 0.05);
        osc.frequency.exponentialRampToValueAtTime(150, t + i * 0.05 + 0.12);

        gain.gain.setValueAtTime(0.35, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.13);
      }
    } else {
      // Deep death collapse groan
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.41);
    }
  }

  /**
   * Gold coins pickup chime.
   */
  public playGoldPickup() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  /**
   * Potion drinking gulp sound.
   */
  public playPotionDrink() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Level up triumphant chime fanfare.
   */
  public playLevelUp() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  /**
   * The Butcher's iconic roar: "Ah, Fresh Meat!"
   * Simulated with deep guttural saw FM modulation and sub-bass growl.
   */
  public playButcherRoar() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Sub-bass growl
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(80, t);
    subOsc.frequency.linearRampToValueAtTime(110, t + 0.3);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.9);

    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.linearRampToValueAtTime(0.5, t + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(t);
    subOsc.stop(t + 0.92);

    // FM Screech component
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const cGain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(260, t + 0.1);
    carrier.frequency.exponentialRampToValueAtTime(160, t + 0.7);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(50, t + 0.1);
    modGain.gain.setValueAtTime(180, t + 0.1);

    mod.connect(carrier.frequency);

    cGain.gain.setValueAtTime(0.3, t + 0.1);
    cGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    carrier.connect(cGain);
    cGain.connect(this.ctx.destination);

    mod.start(t + 0.1);
    carrier.start(t + 0.1);
    mod.stop(t + 0.82);
    carrier.stop(t + 0.82);
  }

  /**
   * Ambient dark gothic drone.
   */
  public startAmbientDrone() {
    if (!this.enabled || this.ambientOsc1) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();

    this.ambientOsc1.type = 'sawtooth';
    this.ambientOsc1.frequency.setValueAtTime(55, t); // A1

    this.ambientOsc2.type = 'sine';
    this.ambientOsc2.frequency.setValueAtTime(55.8, t); // Detuned subtle beating

    this.ambientGain.gain.setValueAtTime(0.04, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t);

    this.ambientOsc1.connect(filter);
    this.ambientOsc2.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientOsc1.start(t);
    this.ambientOsc2.start(t);
  }

  public stopAmbientDrone() {
    if (this.ambientOsc1) {
      this.ambientOsc1.stop();
      this.ambientOsc1.disconnect();
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      this.ambientOsc2.stop();
      this.ambientOsc2.disconnect();
      this.ambientOsc2 = null;
    }
  }
}

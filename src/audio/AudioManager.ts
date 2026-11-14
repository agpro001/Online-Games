import type { Settings } from "../performance/PerformanceManager";
export class AudioManager {
  private context: AudioContext | null = null;
  constructor(private settings: () => Settings) {}
  async click() {
    const s = this.settings();
    if (s.master * s.ui === 0) return;
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        220,
        this.context.currentTime + 0.06,
      );
      gain.gain.setValueAtTime(
        s.master * s.ui * 0.15,
        this.context.currentTime,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        this.context.currentTime + 0.08,
      );
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + 0.08);
    } catch {
      /* Audio is optional; browser policy may refuse it. */
    }
  }
  suspend() {
    void this.context?.suspend();
  }
  destroy() {
    void this.context?.close();
    this.context = null;
  }
}

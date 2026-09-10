import type { Preferences } from "./types";

export type Sound =
  | "step"
  | "keyboard"
  | "door"
  | "notification"
  | "coffee"
  | "dialogue"
  | "printer";
class AudioSystem {
  private context: AudioContext | null = null;
  private last: Partial<Record<Sound, number>> = {};
  private ambient: GainNode | null = null;
  private settings: Preferences = {
    master: 0.6,
    music: 0.25,
    effects: 0.6,
    sensitivity: 1,
    quality: "high",
  };
  unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.ambient = this.context.createGain();
      this.ambient.connect(this.context.destination);
      for (const frequency of [130.81, 164.81, 196]) {
        const osc = this.context.createOscillator();
        osc.frequency.value = frequency;
        osc.connect(this.ambient);
        osc.start();
      }
      this.configure(this.settings);
    }
    void this.context.resume();
  }
  configure(p: Preferences) {
    this.settings = p;
    if (this.ambient && this.context)
      this.ambient.gain.setTargetAtTime(
        p.master * p.music * 0.012,
        this.context.currentTime,
        0.15,
      );
  }
  suspend() {
    void this.context?.suspend();
  }
  play(sound: Sound) {
    if (!this.context || this.context.state !== "running") return;
    const now = this.context.currentTime;
    if (now - (this.last[sound] ?? -1) < (sound === "step" ? 0.25 : 0.1))
      return;
    this.last[sound] = now;
    const osc = this.context.createOscillator(),
      gain = this.context.createGain();
    const frequencies: Record<Sound, number> = {
      step: 90,
      keyboard: 650,
      door: 180,
      notification: 660,
      coffee: 240,
      dialogue: 420,
      printer: 140,
    };
    osc.type =
      sound === "keyboard" || sound === "printer" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(frequencies[sound], now);
    osc.frequency.exponentialRampToValueAtTime(
      frequencies[sound] * (sound === "notification" ? 1.5 : 0.6),
      now + 0.12,
    );
    gain.gain.setValueAtTime(
      this.settings.master *
        this.settings.effects *
        (sound === "step" ? 0.045 : 0.09),
      now,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start();
    osc.stop(now + 0.18);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}
export const audio = new AudioSystem();

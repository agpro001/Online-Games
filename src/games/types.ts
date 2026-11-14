export interface Controls {
  joystick: { enabled: boolean; radius: number; deadZone: number };
  buttons: { label: string; action: string }[];
  keyboard: Record<string, string>;
  gamepad: Record<string, string>;
  axes: { left: string; right: string; up: string; down: string };
}
export interface Game {
  id: string;
  title: string;
  series: "GTA" | "Resident Evil" | "Tools";
  year: string;
  description: string;
  runtime: string;
  launchMode: "external" | "iframe" | "pending";
  entry: string | null;
  reference: string | null;
  status: "external" | "available" | "pending";
  rights: string;
  artwork: string | null;
  tone: string;
  accent: string;
  tags: string[];
  aliases: string[];
  mobile: boolean | null;
  fullscreen: boolean;
  touchControls: boolean;
  performance: "Untested" | "Playable" | "Good" | "Excellent";
  performanceTier: "unknown" | "low" | "medium" | "high";
  platform: string;
  landscape: boolean;
  requirements: { wasm: boolean; webgl2: boolean };
  bridge: boolean;
  save: "external" | "lab-json" | "none";
  controls: Controls | null;
  notice: string;
}

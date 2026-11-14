export interface InputState {
  buttons: string[];
  axes: { x: number; y: number };
  look: { x: number; y: number };
}
export class InputAdapter {
  private sources = new Map<string, Set<string>>();
  private axes = new Map<string, { x: number; y: number }>();
  private look = { x: 0, y: 0 };
  constructor(private emit: (state: InputState) => void) {}
  button(source: string, action: string, down: boolean) {
    let set = this.sources.get(source);
    if (!set) {
      set = new Set();
      this.sources.set(source, set);
    }
    if (down) set.add(action);
    else set.delete(action);
    this.publish();
  }
  axis(source: string, x: number, y: number) {
    this.axes.set(source, {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
    this.publish();
  }
  pointer(x: number, y: number) {
    this.look = { x, y };
    this.publish();
    this.look = { x: 0, y: 0 };
  }
  clearSource(source: string) {
    this.sources.delete(source);
    this.axes.delete(source);
    this.publish();
  }
  reset() {
    this.sources.clear();
    this.axes.clear();
    this.look = { x: 0, y: 0 };
    this.publish();
  }
  private publish() {
    const buttons = [
      ...new Set([...this.sources.values()].flatMap((v) => [...v])),
    ];
    let strongest = { x: 0, y: 0 };
    for (const a of this.axes.values())
      if (Math.hypot(a.x, a.y) > Math.hypot(strongest.x, strongest.y))
        strongest = a;
    this.emit({ buttons, axes: strongest, look: this.look });
  }
}

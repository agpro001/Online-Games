import { InputAdapter } from "./InputAdapter";
export class GamepadAdapter {
  private frame = 0;
  private stopped = false;
  constructor(
    private input: InputAdapter,
    private mapping: Record<string, string>,
  ) {
    this.tick();
  }
  private tick = () => {
    if (this.stopped) return;
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find((p) => p?.connected);
    if (pad) {
      for (const [index, action] of Object.entries(this.mapping))
        this.input.button(
          "gamepad",
          action,
          !!pad.buttons[Number(index)]?.pressed,
        );
      const axis = (v: number) => (Math.abs(v) < 0.15 ? 0 : v);
      this.input.axis(
        "gamepad",
        axis(pad.axes[0] ?? 0),
        axis(pad.axes[1] ?? 0),
      );
    } else this.input.clearSource("gamepad");
    this.frame = requestAnimationFrame(this.tick);
  };
  destroy() {
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    this.input.clearSource("gamepad");
  }
}

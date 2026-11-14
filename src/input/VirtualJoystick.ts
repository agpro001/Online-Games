export function joystickVector(
  dx: number,
  dy: number,
  radius: number,
  deadZone: number,
) {
  const length = Math.hypot(dx, dy);
  const magnitude = Math.min(length / Math.max(radius, 1), 1);
  if (magnitude <= deadZone || length === 0)
    return { x: 0, y: 0, magnitude: 0 };
  const scaled = (magnitude - deadZone) / (1 - deadZone);
  return {
    x: (dx / length) * scaled,
    y: (dy / length) * scaled,
    magnitude: scaled,
  };
}
export class VirtualJoystick {
  private pointer: number | null = null;
  private center = { x: 0, y: 0 };
  private abort = new AbortController();
  constructor(
    private base: HTMLElement,
    private knob: HTMLElement,
    private radius: number,
    private deadZone: number,
    private change: (x: number, y: number) => void,
  ) {
    const options = { signal: this.abort.signal };
    base.style.touchAction = "none";
    base.addEventListener(
      "pointerdown",
      (e) => {
        if (this.pointer !== null) return;
        e.preventDefault();
        this.pointer = e.pointerId;
        const r = base.getBoundingClientRect();
        this.center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        base.setPointerCapture(e.pointerId);
        this.move(e);
      },
      options,
    );
    base.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerId === this.pointer) this.move(e);
      },
      options,
    );
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      base.addEventListener(
        name,
        (e) => {
          if ((e as PointerEvent).pointerId === this.pointer) this.reset();
        },
        options,
      );
    window.addEventListener("blur", () => this.reset(), options);
    window.addEventListener("resize", () => this.reset(), options);
  }
  private move(e: PointerEvent) {
    const v = joystickVector(
      e.clientX - this.center.x,
      e.clientY - this.center.y,
      this.radius,
      this.deadZone,
    );
    this.knob.style.transform = `translate(${v.x * this.radius * 0.55}px,${v.y * this.radius * 0.55}px)`;
    this.change(v.x, v.y);
  }
  reset() {
    const id = this.pointer;
    this.pointer = null;
    if (id !== null && this.base.hasPointerCapture(id))
      this.base.releasePointerCapture(id);
    this.knob.style.transform = "";
    this.change(0, 0);
  }
  destroy() {
    this.reset();
    this.abort.abort();
  }
}

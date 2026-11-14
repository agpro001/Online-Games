import { InputAdapter } from "./InputAdapter";
import { VirtualJoystick } from "./VirtualJoystick";
import type { Controls } from "../games/types";
import type { Settings } from "../performance/PerformanceManager";
import { el } from "../ui/dom";
export class TouchAdapter {
  private abort = new AbortController();
  private joystick: VirtualJoystick;
  readonly root = el("div", "touch-controls");
  constructor(
    private input: InputAdapter,
    controls: Controls,
    settings: Settings,
    parent: HTMLElement,
  ) {
    this.root.dataset.side = settings.side;
    const base = el("div", "joystick");
    base.setAttribute(
      "aria-label",
      "Movement joystick. Keyboard alternative: WASD or arrows.",
    );
    const knob = el("div", "joystick-knob");
    base.append(knob);
    const label = el("span", "joystick-label", "MOVE");
    base.append(label);
    this.root.append(base);
    base.hidden = !controls.joystick.enabled;
    this.joystick = new VirtualJoystick(
      base,
      knob,
      settings.radius,
      controls.joystick.deadZone,
      (x, y) => {
        input.axis("joystick", x, y);
        const a = controls.axes;
        input.button("joystick", a.left, x < -0.25);
        input.button("joystick", a.right, x > 0.25);
        input.button("joystick", a.up, y < -0.25);
        input.button("joystick", a.down, y > 0.25);
      },
    );
    const buttons = el("div", "action-buttons");
    for (const mapping of controls.buttons) {
      const b = el("button", "action-button", mapping.label);
      b.type = "button";
      b.setAttribute("aria-label", mapping.label);
      const held = new Set<number>();
      const source = "touch:" + mapping.action;
      b.addEventListener(
        "pointerdown",
        (e) => {
          e.preventDefault();
          held.add(e.pointerId);
          b.setPointerCapture(e.pointerId);
          input.button(source, mapping.action, true);
          b.classList.add("held");
        },
        { signal: this.abort.signal },
      );
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
        b.addEventListener(
          type,
          (e) => {
            held.delete((e as PointerEvent).pointerId);
            if (!held.size) {
              input.clearSource(source);
              b.classList.remove("held");
            }
          },
          { signal: this.abort.signal },
        );
      b.addEventListener(
        "keydown",
        (e) => {
          if (e.code === "Space" || e.code === "Enter") {
            e.preventDefault();
            input.button("accessible:" + mapping.action, mapping.action, true);
          }
        },
        { signal: this.abort.signal },
      );
      b.addEventListener(
        "keyup",
        () => input.clearSource("accessible:" + mapping.action),
        { signal: this.abort.signal },
      );
      buttons.append(b);
    }
    this.root.append(buttons);
    parent.append(this.root);
  }
  destroy() {
    this.joystick.destroy();
    this.abort.abort();
    this.root.remove();
    this.input.reset();
  }
}

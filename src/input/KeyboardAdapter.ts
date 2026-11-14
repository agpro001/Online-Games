import { InputAdapter } from "./InputAdapter";
export class KeyboardAdapter {
  private abort = new AbortController();
  constructor(
    private input: InputAdapter,
    mapping: Record<string, string>,
    targets: Window[] = [window],
  ) {
    for (const target of targets)
      for (const type of ["keydown", "keyup"] as const)
        target.addEventListener(
          type,
          (e) => {
            if (
              (e.target as HTMLElement)?.closest(
                "input,select,textarea,button,a",
              )
            )
              return;
            const action = mapping[e.code];
            if (!action) return;
            e.preventDefault();
            input.button("keyboard:" + e.code, action, type === "keydown");
          },
          { signal: this.abort.signal },
        );
    window.addEventListener("blur", () => input.reset(), {
      signal: this.abort.signal,
    });
  }
  destroy() {
    this.abort.abort();
    this.input.reset();
  }
}

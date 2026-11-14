import { el } from "./dom";
export class Loader {
  readonly root = el("div", "runtime-loader");
  constructor(title: string) {
    this.root.setAttribute("role", "status");
    const progress = el("progress");
    progress.setAttribute(
      "aria-label",
      "Runtime initialization, progress unknown",
    );
    this.root.append(
      el("div", "eyebrow muted", "INITIALIZING AUTHORIZED RUNTIME"),
      el("h2", "", title),
      progress,
      el(
        "p",
        "",
        "Waiting for a verified first-render readiness message. Byte progress is not exposed.",
      ),
    );
  }
  destroy() {
    this.root.remove();
  }
}

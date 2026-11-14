export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}
export function button(
  text: string,
  action: () => void,
  className = "",
): HTMLButtonElement {
  const b = el("button", className, text);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
export function link(
  text: string,
  href: string,
  className = "",
): HTMLAnchorElement {
  const a = el("a", className, text);
  a.href = href;
  return a;
}
export function externalLink(
  text: string,
  url: string,
  className = "",
): HTMLAnchorElement {
  const a = link(text, url, className);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.referrerPolicy = "no-referrer";
  return a;
}
export function message(text: string) {
  const e = document.getElementById("toast");
  if (e) {
    e.textContent = text;
    e.hidden = false;
    window.setTimeout(() => {
      if (e.textContent === text) e.hidden = true;
    }, 6000);
  }
}
export async function toggleFullscreen(element: HTMLElement): Promise<string> {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
      return "Exited fullscreen";
    } catch {
      return "Could not exit fullscreen";
    }
  }
  if (!document.fullscreenEnabled || !element.requestFullscreen)
    return "Fullscreen unavailable; use the browser display controls.";
  try {
    await element.requestFullscreen();
    return "Entered fullscreen";
  } catch {
    return "Fullscreen was declined. The page remains usable in windowed mode.";
  }
}

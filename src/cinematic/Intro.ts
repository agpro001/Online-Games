import { store } from "../storage/StorageManager";
import { el, button } from "../ui/dom";
const scenes = [
  "AN AFTERHOURS EXPERIENCE",
  "THE CLASSICS NEVER SLEEP",
  "YOUR NEXT LATE NIGHT STARTS HERE",
  "THE CITY IS YOURS",
  "A NEW WAY IN",
  "WELCOME TO THE COLLECTION",
];
export class Intro {
  private timer = 0;
  private overlay: HTMLDialogElement | null = null;
  show() {
    this.close();
    const previous = document.activeElement as HTMLElement | null;
    const d = el("dialog", "intro cinematic-intro");
    d.setAttribute("aria-label", "Cinematic introduction");
    const label = el("span", "intro-line", scenes[0]);
    const title = el("h1", "", "THE CITY\nIS YOURS.");
    const caption = el("p", "", "Same games. A different entrance.");
    const actions = el("div", "intro-actions");
    const finish = (hash: string) => {
      this.close();
      previous?.focus();
      location.hash = hash;
    };
    actions.append(
      button("PLAY / FEATURED", () => finish("#/game/vc")),
      button("LIBRARY", () => finish("#/library")),
      button("SETTINGS", () => finish("#/settings")),
    );
    actions.hidden = true;
    const skip = button("Skip intro ↗", () => {
      this.close();
      previous?.focus();
    });
    d.append(label, title, caption, actions, skip);
    document.body.append(d);
    this.overlay = d;
    d.showModal();
    let i = 0;
    const advance = () => {
      i++;
      label.textContent = scenes[Math.min(i, scenes.length - 1)];
      d.dataset.scene = String(i);
      if (i < scenes.length - 1) this.timer = window.setTimeout(advance, 1000);
      else {
        actions.hidden = false;
        skip.textContent = "Enter the collection ↗";
      }
    };
    this.timer = window.setTimeout(advance, 700);
    d.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.close();
      previous?.focus();
    });
    skip.focus();
  }
  auto(motion: boolean) {
    if (
      !store.get(
        "introSeen",
        false,
        (v): v is boolean => typeof v === "boolean",
      ) &&
      motion
    )
      this.show();
  }
  close() {
    clearTimeout(this.timer);
    if (this.overlay) {
      this.overlay.close();
      this.overlay.remove();
      this.overlay = null;
      store.set("introSeen", true);
    }
  }
}

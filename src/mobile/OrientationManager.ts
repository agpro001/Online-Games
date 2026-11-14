export class OrientationManager {
  private media = matchMedia("(orientation: portrait)");
  private listener = () => {
    this.element.hidden = !(
      this.required &&
      this.media.matches &&
      navigator.maxTouchPoints > 0
    );
  };
  constructor(
    private element: HTMLElement,
    private required: boolean,
  ) {
    this.media.addEventListener("change", this.listener);
    this.listener();
  }
  destroy() {
    this.media.removeEventListener("change", this.listener);
    this.element.hidden = true;
  }
}

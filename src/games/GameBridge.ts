export type RuntimeMessage = {
  type:
    | "GAME_READY"
    | "GAME_PAUSED"
    | "GAME_RESUMED"
    | "GAME_ERROR"
    | "REQUEST_FULLSCREEN"
    | "EXIT_GAME"
    | "SAVE_EXPORT";
  payload?: unknown;
};
const allowed = new Set([
  "GAME_READY",
  "GAME_PAUSED",
  "GAME_RESUMED",
  "GAME_ERROR",
  "REQUEST_FULLSCREEN",
  "EXIT_GAME",
  "SAVE_EXPORT",
]);
export class GameBridge {
  private listener = (event: MessageEvent) => {
    if (
      event.origin !== this.origin ||
      event.source !== this.frame.contentWindow ||
      !event.data ||
      event.data.channel !== "afterhours-v1" ||
      !allowed.has(event.data.type)
    )
      return;
    this.receive(event.data as RuntimeMessage);
  };
  constructor(
    private frame: HTMLIFrameElement,
    private origin: string,
    private receive: (message: RuntimeMessage) => void,
  ) {
    window.addEventListener("message", this.listener);
  }
  send(type: string, payload?: unknown) {
    this.frame.contentWindow?.postMessage(
      { channel: "afterhours-v1", type, payload },
      this.origin,
    );
  }
  destroy() {
    window.removeEventListener("message", this.listener);
  }
}

export type State =
  | "IDLE"
  | "PRELOADING"
  | "LOADING"
  | "READY"
  | "PLAYING"
  | "PAUSED"
  | "ERROR"
  | "EXITING"
  | "CLEANUP";
const transitions: Record<State, State[]> = {
  IDLE: ["PRELOADING"],
  PRELOADING: ["LOADING", "ERROR", "EXITING"],
  LOADING: ["READY", "ERROR", "EXITING"],
  READY: ["PLAYING", "ERROR", "EXITING"],
  PLAYING: ["PAUSED", "ERROR", "EXITING"],
  PAUSED: ["PLAYING", "ERROR", "EXITING"],
  ERROR: ["EXITING"],
  EXITING: ["CLEANUP"],
  CLEANUP: ["IDLE"],
};
export class GameSession {
  state: State = "IDLE";
  constructor(private changed: (state: State) => void = () => {}) {}
  transition(next: State) {
    if (!transitions[this.state].includes(next))
      throw new Error(`Invalid session transition ${this.state} → ${next}`);
    this.state = next;
    this.changed(next);
  }
  stop() {
    if (this.state === "IDLE") return;
    this.transition("EXITING");
    this.transition("CLEANUP");
    this.transition("IDLE");
  }
}

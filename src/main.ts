import "@fontsource/barlow-condensed/latin-700.css";
import "./style.css";
import "./app.css";
import { App } from "./app/App";
import { message } from "./ui/dom";
const app = new App();
if (import.meta.hot) import.meta.hot.dispose(() => app.destroy());
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        const notify = () => {
          const banner = document.getElementById("update")!;
          banner.hidden = false;
          document.getElementById("applyUpdate")!.onclick = () => {
            updating = true;
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          };
        };
        if (registration.waiting) notify();
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              notify();
          });
        });
      })
      .catch(() =>
        message("Offline shell could not be enabled in this browser."),
      );
  });
  let reloading = false;
  let updating = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updating && !reloading) {
      reloading = true;
      location.reload();
    }
  });
}

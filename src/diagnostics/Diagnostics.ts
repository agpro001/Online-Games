import { detectDevice } from "../performance/DeviceDetector";
import { el, button } from "../ui/dom";
export async function indexedDBProbe(): Promise<string> {
  if (!("indexedDB" in window)) return "Unavailable";
  return new Promise((resolve) => {
    const name = "afterhours-probe-" + Date.now();
    let done = false;
    const finish = (result: string) => {
      if (!done) {
        done = true;
        resolve(result);
      }
    };
    const timeout = setTimeout(() => finish("Timed out / blocked"), 2500);
    try {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("probe");
      r.onerror = () => {
        clearTimeout(timeout);
        finish("Open failed");
      };
      r.onblocked = () => {
        clearTimeout(timeout);
        finish("Blocked");
      };
      r.onsuccess = () => {
        const db = r.result;
        try {
          const t = db.transaction("probe", "readwrite");
          t.objectStore("probe").put("test", "key");
          t.oncomplete = () => {
            db.close();
            indexedDB.deleteDatabase(name);
            clearTimeout(timeout);
            finish("Read/write transaction passed");
          };
          t.onerror = () => {
            db.close();
            clearTimeout(timeout);
            finish("Transaction failed");
          };
        } catch {
          db.close();
          clearTimeout(timeout);
          finish("Transaction failed");
        }
      };
    } catch {
      clearTimeout(timeout);
      finish("Denied");
    }
  });
}
export function renderDiagnostics(root: HTMLElement): () => void {
  const abort = new AbortController();
  let frame = 0;
  const c = detectDevice();
  root.append(
    el("div", "eyebrow muted", "LOCAL DEVICE REPORT"),
    el("h1", "", "Diagnostics"),
    el(
      "p",
      "page-copy",
      "These checks stay on this device. Feature support is not a game performance rating. Browser screen size is not physical-device QA.",
    ),
  );
  const table = el("div", "diagnostic-grid");
  for (const [k, v] of Object.entries(c)) {
    const row = el("div", "check-row");
    row.append(
      el("span", "", k),
      el("strong", "", v === null ? "Not exposed" : String(v)),
    );
    table.append(row);
  }
  const storageRow = el("div", "check-row");
  let local = "Unavailable";
  try {
    localStorage.setItem("afterhours-probe", "1");
    localStorage.removeItem("afterhours-probe");
    local = "Read/write passed";
  } catch {
    /* Blocked by browser policy. */
  }
  storageRow.append(el("span", "", "localStorage"), el("strong", "", local));
  table.append(storageRow);
  const idbRow = el("div", "check-row");
  const idb = el("strong", "", "Testing…");
  idbRow.append(el("span", "", "IndexedDB"), idb);
  table.append(idbRow);
  void indexedDBProbe().then((v) => {
    if (!abort.signal.aborted) idb.textContent = v;
  });
  root.append(table);
  const section = el("section", "benchmark");
  section.append(
    el("h2", "", "Canvas frame-pacing sample"),
    el(
      "p",
      "page-copy",
      "Two seconds of 120 rectangles at capped DPR 1. This samples browser requestAnimationFrame pacing and Canvas 2D, not game FPS or sustained thermal performance. Keep the tab visible.",
    ),
  );
  const canvas = el("canvas");
  canvas.width = 480;
  canvas.height = 200;
  canvas.style.maxWidth = "100%";
  const result = el("p", "", "Not run");
  const run = button(
    "Run local sample",
    () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        result.textContent = "Canvas 2D unavailable";
        return;
      }
      run.disabled = true;
      result.textContent = "Measuring real frame intervals…";
      const samples: number[] = [];
      let start = 0,
        last = 0;
      const tick = (now: number) => {
        if (document.hidden) {
          result.textContent = "Cancelled: tab hidden";
          run.disabled = false;
          return;
        }
        if (!start) start = now;
        if (last) samples.push(now - last);
        last = now;
        ctx.fillStyle = "#131a23";
        ctx.fillRect(0, 0, 480, 200);
        for (let i = 0; i < 120; i++) {
          ctx.fillStyle = i % 2 ? "#f39abb" : "#97d8d1";
          ctx.fillRect((i * 31 + now * 0.03) % 480, (i * 19) % 190, 4, 4);
        }
        if (now - start < 2000) frame = requestAnimationFrame(tick);
        else {
          const sorted = [...samples].sort((a, b) => a - b);
          const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
          result.textContent = `${samples.length} intervals · mean ${mean.toFixed(1)} ms · p95 ${(sorted[Math.floor(sorted.length * 0.95)] ?? 0).toFixed(1)} ms · ${(1000 / mean).toFixed(1)} callbacks/s. Not a game benchmark.`;
          run.disabled = false;
        }
      };
      frame = requestAnimationFrame(tick);
    },
    "primary",
  );
  section.append(run, canvas, result);
  root.append(section);
  return () => {
    abort.abort();
    cancelAnimationFrame(frame);
  };
}

/**
 * Compose final HTML QA report from Playwright + journey results.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

type JourneyFile = {
  passed: number;
  failed: number;
  results: Array<{
    name: string;
    status: "passed" | "failed";
    detail: string;
    durationMs: number;
  }>;
};

type PlaywrightJson = {
  suites?: Array<{
    title: string;
    suites?: unknown[];
    specs?: Array<{
      title: string;
      ok: boolean;
      tests?: Array<{
        results?: Array<{
          status: string;
          duration: number;
          error?: { message?: string };
        }>;
      }>;
    }>;
  }>;
};

function collectSpecs(
  suites: PlaywrightJson["suites"] = [],
  out: Array<{
    name: string;
    status: string;
    durationMs: number;
    detail: string;
  }> = []
) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const result = spec.tests?.[0]?.results?.[0];
      out.push({
        name: `Playwright — ${spec.title}`,
        status: spec.ok ? "passed" : "failed",
        durationMs: result?.duration ?? 0,
        detail: result?.error?.message ?? (spec.ok ? "ok" : "failed"),
      });
    }
    collectSpecs(suite.suites as PlaywrightJson["suites"], out);
  }
  return out;
}

function main() {
  mkdirSync("qa-report/screenshots", { recursive: true });

  const journeyPath = join("qa-report", "journey-results.json");
  const pwPath = join("qa-report", "playwright-results.json");
  const journey: JourneyFile = existsSync(journeyPath)
    ? JSON.parse(readFileSync(journeyPath, "utf8"))
    : { passed: 0, failed: 0, results: [] };

  const pwSpecs = existsSync(pwPath)
    ? collectSpecs(
        (JSON.parse(readFileSync(pwPath, "utf8")) as PlaywrightJson).suites
      )
    : [];

  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];
  for (const file of readdirSync("qa-report").filter((f) =>
    f.startsWith("meta-")
  )) {
    const meta = JSON.parse(readFileSync(join("qa-report", file), "utf8")) as {
      consoleErrors?: string[];
      networkFailures?: string[];
    };
    consoleErrors.push(...(meta.consoleErrors ?? []));
    networkFailures.push(...(meta.networkFailures ?? []));
  }

  const screenshots = existsSync("qa-report/screenshots")
    ? readdirSync("qa-report/screenshots").filter((f) =>
        /\.(png|jpg|jpeg|webp)$/i.test(f)
      )
    : [];

  const perfPath = join("qa-report", "performance.json");
  const performance = existsSync(perfPath)
    ? (JSON.parse(readFileSync(perfPath, "utf8")) as Array<{
        route: string;
        ttfbMs: number;
        loadMs: number;
      }>)
    : [];

  const rows = [
    ...journey.results.map((r) => ({
      name: r.name,
      status: r.status,
      durationMs: r.durationMs,
      detail: r.detail,
    })),
    ...pwSpecs,
  ];

  const passed = rows.filter((r) => r.status === "passed").length;
  const failed = rows.filter((r) => r.status !== "passed").length;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>ChurchOS QA Report</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #0f172a; background: linear-gradient(180deg,#f8fafc,#eef2ff); }
    h1 { font-family: "Fraunces", Georgia, serif; margin-bottom: .25rem; }
    .meta { color: #475569; margin-bottom: 1.5rem; }
    .ok { color: #047857; font-weight: 600; }
    .bad { color: #b91c1c; font-weight: 600; }
    section { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 8px 30px rgba(15,23,42,.04); }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e2e8f0; padding: .55rem .7rem; text-align: left; vertical-align: top; font-size: 14px; }
    th { background: #f8fafc; }
    code { background: #f1f5f9; padding: .1rem .3rem; border-radius: 4px; word-break: break-word; }
    .shots { display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap: 1rem; }
    .shots figure { margin: 0; }
    .shots img { width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; }
    ul { margin: .5rem 0 0; padding-left: 1.2rem; }
  </style>
</head>
<body>
  <h1>ChurchOS QA Report</h1>
  <p class="meta">Generated ${new Date().toISOString()} · <span class="ok">${passed} passed</span> · <span class="bad">${failed} failed</span></p>

  <section>
    <h2>Journey results</h2>
    <table>
      <thead><tr><th>Journey</th><th>Status</th><th>Duration</th><th>Detail</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => `<tr>
          <td>${r.name}</td>
          <td class="${r.status === "passed" ? "ok" : "bad"}">${r.status}</td>
          <td>${r.durationMs}ms</td>
          <td><code>${String(r.detail).replaceAll("<", "&lt;")}</code></td>
        </tr>`
          )
          .join("\n")}
      </tbody>
    </table>
  </section>

  <section>
    <h2>Console errors</h2>
    ${
      consoleErrors.length
        ? `<ul>${consoleErrors.map((e) => `<li><code>${e.replaceAll("<", "&lt;")}</code></li>`).join("")}</ul>`
        : `<p class="ok">None recorded</p>`
    }
  </section>

  <section>
    <h2>Network failures</h2>
    ${
      networkFailures.length
        ? `<ul>${networkFailures.map((e) => `<li><code>${e.replaceAll("<", "&lt;")}</code></li>`).join("")}</ul>`
        : `<p class="ok">None recorded</p>`
    }
  </section>

  <section>
    <h2>Performance metrics</h2>
    ${
      performance.length
        ? `<table><thead><tr><th>Route</th><th>TTFB</th><th>Load</th></tr></thead><tbody>${performance
            .map(
              (p) =>
                `<tr><td>${p.route}</td><td>${p.ttfbMs}ms</td><td>${p.loadMs}ms</td></tr>`
            )
            .join("")}</tbody></table>`
        : `<p>See Playwright timing column above. Authenticated page timings require Clerk session.</p>`
    }
  </section>

  <section>
    <h2>Screenshots</h2>
    ${
      screenshots.length
        ? `<div class="shots">${screenshots
            .map(
              (s) =>
                `<figure><img src="screenshots/${s}" alt="${s}" /><figcaption>${s}</figcaption></figure>`
            )
            .join("")}</div>`
        : `<p>No screenshots captured.</p>`
    }
  </section>

  <section>
    <h2>BUG fixes covered</h2>
    <ul>
      <li><strong>BUG-002</strong> — Member create dialog closes, deferred redirect, toast, profile + activity timeline.</li>
      <li><strong>BUG-003</strong> — CSV/XLSX import with Excel headers, preview/validation, duplicate email skip.</li>
    </ul>
  </section>
</body>
</html>`;

  writeFileSync(join("qa-report", "index.html"), html, "utf8");
  writeFileSync(
    join("qa-report", "summary.json"),
    JSON.stringify(
      {
        passed,
        failed,
        consoleErrors,
        networkFailures,
        screenshots,
        performance,
      },
      null,
      2
    )
  );
  console.log(`Composed qa-report/index.html (${passed} passed, ${failed} failed)`);
}

main();

const promptInput = document.querySelector("#prompt");
const result = document.querySelector("#result");
const samplesRoot = document.querySelector("#samples");
const evaluateButton = document.querySelector("#evaluate");
const clearButton = document.querySelector("#clear");
const runAllButton = document.querySelector("#runAll");

let samples = [];

async function init() {
  samples = await fetchJson("/api/samples");
  renderSamples();
  if (samples[0]) {
    promptInput.value = samples[0].prompt;
    await evaluate(samples[0].id);
  }
}

function renderSamples() {
  samplesRoot.innerHTML = samples.map((sample) => `
    <button class="sample" type="button" data-id="${escapeHtml(sample.id)}">
      ${escapeHtml(sample.title)}
      <span>${escapeHtml(sample.expectedDecision)} boundary</span>
    </button>
  `).join("");

  samplesRoot.querySelectorAll(".sample").forEach((button) => {
    button.addEventListener("click", async () => {
      const sample = samples.find((item) => item.id === button.dataset.id);
      promptInput.value = sample.prompt;
      await evaluate(sample.id);
    });
  });
}

async function evaluate(id = "browser") {
  const payload = await fetchJson("/api/evaluate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, prompt: promptInput.value })
  });
  renderResult(payload);
}

async function runAll() {
  const evaluations = [];
  for (const sample of samples) {
    const response = await fetchJson("/api/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: sample.id, prompt: sample.prompt })
    });
    evaluations.push(response);
  }
  const counts = evaluations.reduce((acc, item) => {
    acc[item.decision] = (acc[item.decision] ?? 0) + 1;
    return acc;
  }, {});
  result.className = "result";
  result.innerHTML = `
    <div class="decision-row">
      <h2>Suite Complete</h2>
      <span class="badge transform">${evaluations.length} prompts</span>
    </div>
    <div class="metric-grid">
      <div class="metric"><p>Allow</p><strong>${counts.allow ?? 0}</strong></div>
      <div class="metric"><p>Transform</p><strong>${counts.transform ?? 0}</strong></div>
      <div class="metric"><p>Refuse</p><strong>${counts.refuse ?? 0}</strong></div>
    </div>
    <pre>${escapeHtml(JSON.stringify(evaluations.map(({ id, decision, severity, categories }) => ({ id, decision, severity, categories })), null, 2))}</pre>
  `;
}

function renderResult(data) {
  result.className = "result";
  const checks = Object.entries(data.checks).map(([name, check]) => `
    <div class="check">
      <strong class="${check.passed ? "pass" : "fail"}">${escapeHtml(name)}: ${check.passed ? "pass" : "review"}</strong>
      <p>${escapeHtml(check.message)}</p>
    </div>
  `).join("");

  result.innerHTML = `
    <div class="decision-row">
      <h2>Guardrail Trace</h2>
      <span class="badge ${escapeHtml(data.decision)}">${escapeHtml(data.decision)}</span>
    </div>
    <div class="metric-grid">
      <div class="metric"><p>Severity</p><strong>${escapeHtml(data.severity)}</strong></div>
      <div class="metric"><p>Score</p><strong>${data.score}</strong></div>
      <div class="metric"><p>Categories</p><strong>${data.categories.length}</strong></div>
    </div>
    <p>${escapeHtml(data.explanation)}</p>
    <p><strong>Safe response:</strong> ${escapeHtml(data.safeResponse)}</p>
    <div class="checks">${checks}</div>
    <pre>${escapeHtml(JSON.stringify({ categories: data.categories, refusalBoundary: data.refusalBoundary }, null, 2))}</pre>
  `;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

evaluateButton.addEventListener("click", () => evaluate());
clearButton.addEventListener("click", () => {
  promptInput.value = "";
  result.className = "result empty";
  result.innerHTML = "<p>Write a prompt to see the guardrail trace.</p>";
});
runAllButton.addEventListener("click", runAll);

init().catch((error) => {
  result.className = "result";
  result.innerHTML = `<p class="fail">${escapeHtml(error.message)}</p>`;
});

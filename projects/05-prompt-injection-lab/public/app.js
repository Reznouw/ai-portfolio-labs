const sampleSelect = document.querySelector("#sampleSelect");
const promptInput = document.querySelector("#promptInput");
const runButton = document.querySelector("#runButton");
const statusEl = document.querySelector("#status");
const resultEl = document.querySelector("#result");

const samples = await fetch("/api/samples").then((res) => res.json());

for (const sample of samples) {
  const option = document.createElement("option");
  option.value = sample.id;
  option.textContent = sample.title;
  sampleSelect.append(option);
}

promptInput.value = samples[0]?.prompt || "";
sampleSelect.addEventListener("change", () => {
  const sample = samples.find((item) => item.id === sampleSelect.value);
  promptInput.value = sample?.prompt || "";
});

runButton.addEventListener("click", async () => {
  statusEl.textContent = "Running...";
  runButton.disabled = true;

  try {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptInput.value })
    });

    const result = await response.json();
    renderResult(result);
    statusEl.textContent = "Done";
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  } finally {
    runButton.disabled = false;
  }
});

function renderResult(result) {
  resultEl.hidden = false;
  resultEl.innerHTML = "";

  const badge = document.createElement("div");
  badge.className = `badge ${result.risk}`;
  badge.textContent = `${result.risk.toUpperCase()} RISK - ${result.score}/100 - ${result.blocked ? "BLOCKED" : "ALLOWED"}`;
  resultEl.append(badge);

  resultEl.append(section("Unsafe Toy Response", result.unsafeToyResponse));
  resultEl.append(section("Defended Toy Response", result.defendedToyResponse));
  resultEl.append(listSection("Matched Rules", result.matchedRules.map((rule) => `${rule.label}: ${rule.explanation}`), "No injection rule matched."));
  resultEl.append(listSection("Active Defenses", result.defenses.active, "No defenses reported."));
}

function section(title, body) {
  const block = document.createElement("article");
  block.className = "card";
  block.innerHTML = `<h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>`;
  return block;
}

function listSection(title, items, emptyText) {
  const block = document.createElement("article");
  block.className = "card";
  const list = items.length > 0
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(emptyText)}</p>`;
  block.innerHTML = `<h3>${escapeHtml(title)}</h3>${list}`;
  return block;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

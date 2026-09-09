import { classify, extractFeatures, parseImage } from "./classifier.js";

const state = {
  samples: [],
  selectedId: null
};

const sampleList = document.querySelector("#sample-list");
const pixelGrid = document.querySelector("#pixel-grid");
const predictionLabel = document.querySelector("#prediction-label");
const predictionMeta = document.querySelector("#prediction-meta");
const predictionBars = document.querySelector("#prediction-bars");
const featurePanel = document.querySelector("#feature-panel");
const summaryPanel = document.querySelector("#summary-panel");
const sampleTitle = document.querySelector("#sample-title");
const sampleSubtitle = document.querySelector("#sample-subtitle");

async function init() {
  const response = await fetch("/data/samples.json");
  state.samples = await response.json();
  state.selectedId = state.samples[0].id;
  render();
}

function render() {
  renderSampleList();
  renderSelectedSample();
  renderSummary();
}

function renderSampleList() {
  sampleList.innerHTML = "";

  for (const sample of state.samples) {
    const result = classify(sample);
    const button = document.createElement("button");
    button.className = `sample-card ${sample.id === state.selectedId ? "is-active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span>
        <strong>${sample.title}</strong>
        <small>${sample.label} sample</small>
      </span>
      <span class="pill ${result.label === sample.label ? "good" : "warn"}">${result.label}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedId = sample.id;
      render();
    });
    sampleList.append(button);
  }
}

function renderSelectedSample() {
  const sample = state.samples.find((item) => item.id === state.selectedId);
  const result = classify(sample);
  const features = extractFeatures(sample);
  const matrix = parseImage(sample);

  sampleTitle.textContent = sample.title;
  sampleSubtitle.textContent = `Expected ${sample.label}. Input ${features.width} by ${features.height}. Active pixels ${features.activePixels}.`;
  predictionLabel.textContent = result.label;
  predictionMeta.textContent = `${Math.round(result.confidence * 100)} percent confidence from handcrafted image features.`;

  pixelGrid.style.setProperty("--cols", matrix[0].length);
  pixelGrid.innerHTML = "";
  matrix.flat().forEach((value) => {
    const cell = document.createElement("span");
    cell.className = value ? "pixel on" : "pixel";
    pixelGrid.append(cell);
  });

  predictionBars.innerHTML = result.predictions.map((prediction) => `
    <div class="bar-row">
      <span>${prediction.label}</span>
      <div class="bar-track"><i style="width: ${Math.round(prediction.confidence * 100)}%"></i></div>
      <strong>${Math.round(prediction.confidence * 100)}%</strong>
    </div>
  `).join("");

  const visibleFeatures = [
    "density",
    "aspect",
    "horizontalSymmetry",
    "verticalSymmetry",
    "topMass",
    "middleMass",
    "bottomMass",
    "centerGapBottom",
    "sleeveMass",
    "edgeMass"
  ];

  featurePanel.innerHTML = visibleFeatures.map((key) => `
    <div class="feature">
      <span>${labelize(key)}</span>
      <strong>${features[key]}</strong>
    </div>
  `).join("");
}

function renderSummary() {
  const rows = state.samples.map((sample) => ({ sample, result: classify(sample) }));
  const correct = rows.filter((row) => row.sample.label === row.result.label).length;
  const byClass = rows.reduce((accumulator, row) => {
    accumulator[row.sample.label] ??= { total: 0, correct: 0 };
    accumulator[row.sample.label].total += 1;
    accumulator[row.sample.label].correct += row.sample.label === row.result.label ? 1 : 0;
    return accumulator;
  }, {});

  summaryPanel.innerHTML = `
    <div class="summary-card accent">
      <span>Dataset accuracy</span>
      <strong>${correct}/${rows.length}</strong>
    </div>
    ${Object.entries(byClass).map(([label, value]) => `
      <div class="summary-card">
        <span>${label}</span>
        <strong>${value.correct}/${value.total}</strong>
      </div>
    `).join("")}
  `;
}

function labelize(value) {
  return value.replace(/[A-Z]/g, (match) => ` ${match.toLowerCase()}`);
}

init().catch((error) => {
  document.body.innerHTML = `<main class="fatal"><h1>Could not load classifier</h1><pre>${error.stack}</pre></main>`;
});

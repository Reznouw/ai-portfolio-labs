const state = {
  data: null,
  filter: "all",
  query: ""
};

const labelOrder = ["positive", "neutral", "negative"];

const elements = {
  totalSamples: document.querySelector("#totalSamples"),
  positiveRatio: document.querySelector("#positiveRatio"),
  averageScore: document.querySelector("#averageScore"),
  negativeRatio: document.querySelector("#negativeRatio"),
  bars: document.querySelector("#bars"),
  itemGrid: document.querySelector("#itemGrid"),
  polarizedList: document.querySelector("#polarizedList"),
  searchInput: document.querySelector("#searchInput"),
  filters: [...document.querySelectorAll(".filter")]
};

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function scorePrefix(score) {
  return score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
}

function renderMetrics(summary) {
  elements.totalSamples.textContent = summary.total;
  elements.positiveRatio.textContent = formatPercent(summary.positiveRatio);
  elements.averageScore.textContent = scorePrefix(summary.averageScore);
  elements.negativeRatio.textContent = formatPercent(summary.negativeRatio);
}

function renderBars(summary) {
  elements.bars.innerHTML = labelOrder.map((label) => {
    const count = summary.counts[label];
    const width = summary.total === 0 ? 0 : Math.round((count / summary.total) * 100);
    return `
      <div class="bar-row">
        <div class="bar-meta">
          <strong>${label}</strong>
          <span>${count} samples</span>
        </div>
        <div class="bar-track" aria-label="${label} ${width}%">
          <div class="bar-fill ${label}-bg" style="width: ${width}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function itemMatches(item) {
  const matchesFilter = state.filter === "all" || item.sentiment.label === state.filter;
  const haystack = `${item.author} ${item.topic} ${item.text}`.toLowerCase();
  return matchesFilter && haystack.includes(state.query.toLowerCase());
}

function renderItems() {
  const items = state.data.items.filter(itemMatches);
  elements.itemGrid.innerHTML = items.length === 0
    ? `<article class="item-card"><h3>No samples found</h3><p>Try another search term or sentiment filter.</p></article>`
    : items.map((item) => `
      <article class="item-card">
        <div class="item-topline">
          <div>
            <h3>${item.topic}</h3>
            <div class="meta">${item.author} - ${item.source} - score ${scorePrefix(item.sentiment.score)}</div>
          </div>
          <span class="badge ${item.sentiment.label}">${item.sentiment.label}</span>
        </div>
        <p>${item.text}</p>
        <div class="evidence" aria-label="Matched sentiment terms">
          ${item.sentiment.evidence.length === 0 ? "No lexicon terms matched" : item.sentiment.evidence.map((term) => `
            <span class="token">${term.token} ${scorePrefix(term.score)}</span>
          `).join("")}
        </div>
      </article>
    `).join("");
}

function renderPolarized(summary) {
  elements.polarizedList.innerHTML = summary.topPolarized.map((item) => `
    <article class="polarized-card">
      <div>
        <strong>${item.topic}</strong>
        <span class="meta">${item.author} - ${item.label}</span>
      </div>
      <span class="score">${scorePrefix(item.score)}</span>
    </article>
  `).join("");
}

function renderDashboard() {
  renderMetrics(state.data.summary);
  renderBars(state.data.summary);
  renderItems();
  renderPolarized(state.data.summary);
}

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderItems();
});

elements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    elements.filters.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
    });
    renderItems();
  });
});

fetch("/api/sentiment")
  .then((response) => response.json())
  .then((data) => {
    state.data = data;
    renderDashboard();
  })
  .catch((error) => {
    elements.itemGrid.innerHTML = `<article class="item-card"><h3>Dashboard failed to load</h3><p>${error.message}</p></article>`;
  });

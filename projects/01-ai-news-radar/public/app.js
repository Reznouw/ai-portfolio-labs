const state = {
  items: [],
  source: "all",
  query: ""
};

const list = document.querySelector("#news-list");
const template = document.querySelector("#card-template");
const sourceFilter = document.querySelector("#source-filter");
const search = document.querySelector("#search");
const itemCount = document.querySelector("#item-count");
const sourceStats = document.querySelector("#source-stats");

async function boot() {
  try {
    const response = await fetch("/data/news.json");
    if (!response.ok) throw new Error("No data yet");
    const data = await response.json();
    state.items = data.items || [];
    populateSources();
    renderStats();
    render();
  } catch {
    list.innerHTML = `<div class="empty">No hay datos todavia. Ejecuta <code>npm run fetch</code> y recarga la pagina.</div>`;
  }
}

function populateSources() {
  const sources = [...new Set(state.items.map((item) => item.source))].sort();
  for (const source of sources) {
    const option = document.createElement("option");
    option.value = source;
    option.textContent = source;
    sourceFilter.append(option);
  }
}

function renderStats() {
  itemCount.textContent = state.items.length;
  const counts = state.items.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {});

  sourceStats.innerHTML = Object.entries(counts)
    .map(([source, count]) => `<article class="meta-card"><strong>${count}</strong><span>${source}</span></article>`)
    .join("");
}

function render() {
  const query = state.query.toLowerCase();
  const filtered = state.items.filter((item) => {
    const matchesSource = state.source === "all" || item.source === state.source;
    const haystack = `${item.title} ${item.description} ${item.ai?.summary} ${item.tags?.join(" ")}`.toLowerCase();
    return matchesSource && haystack.includes(query);
  });

  list.innerHTML = "";

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">No encontre noticias con esos filtros.</div>`;
    return;
  }

  for (const item of filtered) {
    const node = template.content.cloneNode(true);
    node.querySelector(".source").textContent = item.source;
    node.querySelector(".date").textContent = formatDate(item.publishedAt);
    node.querySelector("h2").textContent = item.title;
    node.querySelector(".summary").textContent = item.ai?.summary || item.description || "Sin resumen.";
    node.querySelector(".why").textContent = item.ai?.whyItMatters || "Revisar fuente para mas contexto.";
    node.querySelector("a").href = item.url;
    node.querySelector(".tags").replaceChildren(...(item.tags || []).map(createTag));
    list.append(node);
  }
}

function createTag(label) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = label;
  return span;
}

function formatDate(value) {
  if (!value) return "sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return new Intl.DateTimeFormat("es", { month: "short", day: "2-digit" }).format(date);
}

sourceFilter.addEventListener("change", (event) => {
  state.source = event.target.value;
  render();
});

search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

boot();

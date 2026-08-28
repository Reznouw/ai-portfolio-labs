const state = {
  data: null,
  activeTopicId: null,
  query: ""
};

const elements = {
  docCount: document.querySelector("#docCount"),
  topicCount: document.querySelector("#topicCount"),
  methodName: document.querySelector("#methodName"),
  topicButtons: document.querySelector("#topicButtons"),
  activeTopicTitle: document.querySelector("#activeTopicTitle"),
  activeTopicMeta: document.querySelector("#activeTopicMeta"),
  termBars: document.querySelector("#termBars"),
  documents: document.querySelector("#documents"),
  searchInput: document.querySelector("#searchInput")
};

function matchesQuery(documentItem, topic) {
  if (!state.query) return true;
  const haystack = [
    documentItem.title,
    documentItem.text,
    documentItem.category,
    documentItem.source,
    topic.label,
    ...topic.terms.map((term) => term.term),
    ...documentItem.topTerms
  ].join(" ").toLowerCase();
  return haystack.includes(state.query);
}

function getActiveTopic() {
  return state.data.topics.find((topic) => topic.id === state.activeTopicId) || state.data.topics[0];
}

function renderTopicButtons() {
  elements.topicButtons.innerHTML = state.data.topics.map((topic) => {
    const pressed = topic.id === state.activeTopicId ? "true" : "false";
    const terms = topic.terms.slice(0, 3).map((term) => term.term).join(", ");
    return `
      <button class="topic-button" type="button" data-topic-id="${topic.id}" aria-pressed="${pressed}">
        <strong>${topic.label}</strong>
        <span>${topic.documents.length} docs - ${terms}</span>
      </button>
    `;
  }).join("");
}

function renderTermBars(topic) {
  const maxScore = Math.max(...topic.terms.map((term) => term.score), 0.01);
  elements.termBars.innerHTML = topic.terms.map((term) => {
    const width = Math.max(8, Math.round((term.score / maxScore) * 100));
    return `
      <div class="term-row">
        <strong>${term.term}</strong>
        <div class="bar" aria-hidden="true"><span style="width: ${width}%"></span></div>
        <span>${term.score.toFixed(3)}</span>
      </div>
    `;
  }).join("");
}

function renderDocuments(topic) {
  const documents = topic.documents.filter((documentItem) => matchesQuery(documentItem, topic));
  if (documents.length === 0) {
    elements.documents.innerHTML = `<div class="empty">No documents match this search inside the selected topic.</div>`;
    return;
  }

  elements.documents.innerHTML = documents.map((documentItem) => `
    <article class="doc-card">
      <div class="doc-topline">
        <span>${documentItem.source} - ${documentItem.category}</span>
        <span>cluster score ${documentItem.clusterScore.toFixed(2)} - ${documentItem.tokenCount} tokens</span>
      </div>
      <h3>${documentItem.title}</h3>
      <p>${documentItem.text}</p>
      <div class="tags" aria-label="Top document terms">
        ${documentItem.topTerms.map((term) => `<span class="tag">${term}</span>`).join("")}
      </div>
    </article>
  `).join("");
}

function render() {
  const topic = getActiveTopic();
  state.activeTopicId = topic.id;
  elements.docCount.textContent = state.data.documentCount;
  elements.topicCount.textContent = `${state.data.topicCount} topics`;
  elements.methodName.textContent = state.data.method.replace("Local ", "");
  elements.activeTopicTitle.textContent = topic.label;
  elements.activeTopicMeta.textContent = `${topic.documents.length} documents assigned`;
  renderTopicButtons();
  renderTermBars(topic);
  renderDocuments(topic);
}

elements.topicButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-topic-id]");
  if (!button) return;
  state.activeTopicId = button.dataset.topicId;
  render();
});

elements.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  render();
});

try {
  const response = await fetch("data/topics.json");
  state.data = await response.json();
  state.activeTopicId = state.data.topics[0]?.id;
  render();
} catch (error) {
  elements.activeTopicTitle.textContent = "Could not load topics";
  elements.documents.innerHTML = `<div class="empty">Run npm run build, then refresh this page.</div>`;
  console.error(error);
}

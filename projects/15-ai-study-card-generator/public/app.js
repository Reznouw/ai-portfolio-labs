const state = {
  deck: null,
  reviewed: new Set(),
  query: "",
  difficulty: "all"
};

const cardsEl = document.querySelector("#cards");
const cardCountEl = document.querySelector("#card-count");
const reviewedCountEl = document.querySelector("#reviewed-count");
const searchEl = document.querySelector("#search");
const difficultyEl = document.querySelector("#difficulty");

searchEl.addEventListener("input", () => {
  state.query = searchEl.value.trim().toLowerCase();
  render();
});

difficultyEl.addEventListener("change", () => {
  state.difficulty = difficultyEl.value;
  render();
});

const response = await fetch("/reports/cards/cards.json");
state.deck = await response.json();
cardCountEl.textContent = state.deck.cards.length;
render();

function render() {
  if (!state.deck) return;
  const cards = state.deck.cards.filter(matchesFilters);
  reviewedCountEl.textContent = state.reviewed.size;

  if (cards.length === 0) {
    cardsEl.innerHTML = '<div class="empty">No cards match the current filters.</div>';
    return;
  }

  cardsEl.innerHTML = cards.map(renderCard).join("");

  for (const cardEl of cardsEl.querySelectorAll(".card")) {
    const id = cardEl.dataset.id;
    cardEl.querySelector("[data-action='flip']").addEventListener("click", () => {
      cardEl.classList.toggle("is-open");
    });
    cardEl.querySelector("[data-action='review']").addEventListener("click", () => {
      state.reviewed.add(id);
      render();
    });
  }
}

function matchesFilters(card) {
  const text = `${card.concept} ${card.tags.join(" ")} ${card.back}`.toLowerCase();
  const matchesQuery = !state.query || text.includes(state.query);
  const matchesDifficulty = state.difficulty === "all" || card.difficulty === state.difficulty;
  return matchesQuery && matchesDifficulty;
}

function renderCard(card) {
  const reviewed = state.reviewed.has(card.id);
  return `
    <article class="card${reviewed ? " reviewed" : ""}" data-id="${escapeHtml(card.id)}">
      <div class="card-header">
        <div>
          <span class="chip">${escapeHtml(card.id)}</span>
          <h2>${escapeHtml(card.concept)}</h2>
        </div>
        <span class="chip">${escapeHtml(card.difficulty)}</span>
      </div>
      <div class="meta">
        ${card.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="question">
        ${escapeHtml(card.front)}
        <div class="answer">${escapeHtml(card.back)}</div>
      </div>
      <p class="evidence"><strong>Evidence:</strong> ${escapeHtml(card.evidence)}</p>
      <p class="prompt-title">Review prompt</p>
      <p class="evidence">${escapeHtml(card.reviewPrompt)}</p>
      <div class="actions">
        <button type="button" data-action="flip">Show answer</button>
        <button type="button" class="secondary" data-action="review">${reviewed ? "Reviewed" : "Mark reviewed"}</button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const userSelect = document.querySelector("#user-select");
const refreshButton = document.querySelector("#refresh-button");
const recommendationList = document.querySelector("#recommendation-list");
const watchedList = document.querySelector("#watched-list");
const favoriteGenres = document.querySelector("#favorite-genres");
const profileUser = document.querySelector("#profile-user");

const statTargets = {
  movies: document.querySelector("#movie-count"),
  ratings: document.querySelector("#rating-count"),
  users: document.querySelector("#user-count"),
  averageRating: document.querySelector("#average-rating")
};

const catalog = await fetchJson("/api/catalog");

for (const user of catalog.users) {
  const option = document.createElement("option");
  option.value = user;
  option.textContent = user;
  userSelect.append(option);
}

renderStats(catalog.stats);
await renderRecommendations(userSelect.value || "U1");

refreshButton.addEventListener("click", () => renderRecommendations(userSelect.value));
userSelect.addEventListener("change", () => renderRecommendations(userSelect.value));

async function renderRecommendations(userId) {
  const data = await fetchJson(`/api/recommendations?user=${encodeURIComponent(userId)}&limit=5`);
  profileUser.textContent = userId;
  renderProfile(data.profile);
  renderRecommendationCards(data.recommendations);
}

function renderStats(stats) {
  statTargets.movies.textContent = stats.movies;
  statTargets.ratings.textContent = stats.ratings;
  statTargets.users.textContent = stats.users;
  statTargets.averageRating.textContent = stats.averageRating;
}

function renderProfile(profile) {
  favoriteGenres.innerHTML = "";
  watchedList.innerHTML = "";

  for (const genre of profile.favoriteGenres) {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = genre;
    favoriteGenres.append(pill);
  }

  for (const entry of profile.watched) {
    const item = document.createElement("article");
    item.className = "watched-item";
    item.innerHTML = `
      <strong>${entry.movie.title}</strong>
      <span>${entry.rating} stars / ${entry.movie.genres.join(", ")}</span>
    `;
    watchedList.append(item);
  }
}

function renderRecommendationCards(recommendations) {
  recommendationList.innerHTML = "";

  recommendations.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "recommendation-card";
    card.innerHTML = `
      <div class="rank">${index + 1}</div>
      <div>
        <strong>${item.movie.title} (${item.movie.year})</strong>
        <span>${item.movie.genres.join(", ")} / ${item.movie.mood} / ${item.movie.runtime} min</span>
        <p class="reason">${item.reason}</p>
      </div>
      <div class="score">
        <b>${item.score}</b>
        <small>${Math.round(item.confidence * 100)}% confidence</small>
      </div>
    `;
    recommendationList.append(card);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

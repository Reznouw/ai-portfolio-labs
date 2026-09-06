import { catalogStats, getUsers, loadDataset, profileForUser, recommendForUser } from "./recommender.js";

const args = process.argv.slice(2);
const userId = readArg("--user") || "U1";
const limit = Number(readArg("--limit") || 5);

const { movies, ratings } = await loadDataset();
const users = getUsers(ratings);

if (args.includes("--help")) {
  console.log("Usage: npm run recommend -- --user U1 --limit 5");
  console.log(`Available users: ${users.join(", ")}`);
  process.exit(0);
}

const profile = profileForUser(userId, movies, ratings);
const recommendations = recommendForUser(userId, movies, ratings, limit);
const stats = catalogStats(movies, ratings);

console.log(`Recommender System Lab - ${userId}`);
console.log(`Dataset: ${stats.movies} movies, ${stats.ratings} ratings, ${stats.users} users`);
console.log(`Favorite genres: ${profile.favoriteGenres.join(", ") || "cold start"}`);
console.log("");

recommendations.forEach((item, index) => {
  console.log(`${index + 1}. ${item.movie.title} (${item.movie.year})`);
  console.log(`   Score: ${item.score} | Confidence: ${item.confidence}`);
  console.log(`   Tags: ${item.movie.genres.join(", ")} | Mood: ${item.movie.mood}`);
  console.log(`   Why: ${item.reason}`);
});

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

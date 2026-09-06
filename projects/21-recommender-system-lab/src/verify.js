import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { catalogStats, loadDataset, profileForUser, recommendForUser } from "./recommender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const { movies, ratings } = await loadDataset();
const stats = catalogStats(movies, ratings);
const profile = profileForUser("U1", movies, ratings);
const recommendations = recommendForUser("U1", movies, ratings, 5);

assert(stats.movies === 12, "expected 12 movies");
assert(stats.ratings === 28, "expected 28 ratings");
assert(profile.watched.length === 4, "expected U1 profile to contain 4 watched movies");
assert(recommendations.length === 5, "expected 5 recommendations for U1");
assert(!recommendations.some((item) => profile.watched.some((watched) => watched.movieId === item.movie.id)), "recommendations must exclude watched movies");
assert(recommendations.every((item) => item.score >= 0 && item.score <= 5), "scores must stay in rating range");

await fs.access(path.join(root, "public", "index.html"));
await fs.access(path.join(root, "public", "styles.css"));
await fs.access(path.join(root, "public", "app.js"));
await fs.access(path.join(root, "README.md"));

console.log("Verification passed");
console.log(`Checked ${stats.movies} movies, ${stats.ratings} ratings, ${stats.users} users`);
console.log(`Top recommendation for U1: ${recommendations[0].movie.title} (${recommendations[0].score})`);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

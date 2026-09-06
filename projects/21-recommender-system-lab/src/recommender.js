import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

export async function loadDataset() {
  const [moviesRaw, ratingsRaw] = await Promise.all([
    fs.readFile(path.join(projectRoot, "data", "movies.json"), "utf8"),
    fs.readFile(path.join(projectRoot, "data", "ratings.json"), "utf8")
  ]);

  return {
    movies: JSON.parse(moviesRaw),
    ratings: JSON.parse(ratingsRaw)
  };
}

export function getUsers(ratings) {
  return [...new Set(ratings.map((rating) => rating.userId))].sort();
}

export function recommendForUser(userId, movies, ratings, limit = 5) {
  const byMovie = new Map(movies.map((movie) => [movie.id, movie]));
  const userRatings = ratings.filter((rating) => rating.userId === userId);
  const seen = new Set(userRatings.map((rating) => rating.movieId));

  if (userRatings.length === 0) {
    return popularFallback(movies, ratings, limit);
  }

  const candidates = movies.filter((movie) => !seen.has(movie.id));
  const scored = candidates.map((candidate) => {
    const signals = userRatings
      .map((rated) => {
        const ratedMovie = byMovie.get(rated.movieId);
        const similarity = itemSimilarity(candidate, ratedMovie);

        return {
          title: ratedMovie.title,
          rating: rated.rating,
          similarity,
          weightedScore: similarity * rated.rating
        };
      })
      .filter((signal) => signal.similarity > 0);

    const similarityTotal = signals.reduce((sum, signal) => sum + signal.similarity, 0);
    const predicted = similarityTotal === 0
      ? baselineScore(candidate, ratings)
      : signals.reduce((sum, signal) => sum + signal.weightedScore, 0) / similarityTotal;

    const bestSignal = signals.sort((a, b) => b.weightedScore - a.weightedScore)[0];

    return {
      movie: candidate,
      score: Number(predicted.toFixed(2)),
      confidence: Number(Math.min(0.98, similarityTotal / Math.max(1, userRatings.length)).toFixed(2)),
      reason: bestSignal
        ? `Closest to ${bestSignal.title}, which ${userId} rated ${bestSignal.rating}`
        : "Ranked by catalog popularity because profile overlap is low"
    };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence || a.movie.title.localeCompare(b.movie.title))
    .slice(0, limit);
}

export function profileForUser(userId, movies, ratings) {
  const byMovie = new Map(movies.map((movie) => [movie.id, movie]));
  const watched = ratings
    .filter((rating) => rating.userId === userId)
    .map((rating) => ({ ...rating, movie: byMovie.get(rating.movieId) }))
    .filter((entry) => entry.movie);

  const genreWeights = new Map();
  for (const entry of watched) {
    for (const genre of entry.movie.genres) {
      genreWeights.set(genre, (genreWeights.get(genre) || 0) + entry.rating);
    }
  }

  return {
    userId,
    watched,
    favoriteGenres: [...genreWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre)
  };
}

export function catalogStats(movies, ratings) {
  const users = getUsers(ratings);
  const allGenres = new Set(movies.flatMap((movie) => movie.genres));
  const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

  return {
    users: users.length,
    movies: movies.length,
    ratings: ratings.length,
    genres: allGenres.size,
    averageRating: Number(averageRating.toFixed(2))
  };
}

function itemSimilarity(left, right) {
  if (!left || !right) return 0;

  const leftGenres = new Set(left.genres);
  const rightGenres = new Set(right.genres);
  const sharedGenres = [...leftGenres].filter((genre) => rightGenres.has(genre)).length;
  const unionGenres = new Set([...leftGenres, ...rightGenres]).size;
  const genreScore = unionGenres === 0 ? 0 : sharedGenres / unionGenres;
  const moodScore = left.mood === right.mood ? 0.25 : 0;
  const eraScore = Math.max(0, 0.2 - Math.abs(left.year - right.year) * 0.03);
  const runtimeScore = Math.max(0, 0.15 - Math.abs(left.runtime - right.runtime) / 180);

  return Number(Math.min(1, genreScore + moodScore + eraScore + runtimeScore).toFixed(3));
}

function baselineScore(movie, ratings) {
  const movieRatings = ratings.filter((rating) => rating.movieId === movie.id);
  if (movieRatings.length === 0) return 3;

  return movieRatings.reduce((sum, rating) => sum + rating.rating, 0) / movieRatings.length;
}

function popularFallback(movies, ratings, limit) {
  return movies
    .map((movie) => ({
      movie,
      score: Number(baselineScore(movie, ratings).toFixed(2)),
      confidence: 0.35,
      reason: "Cold-start pick based on average rating"
    }))
    .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
    .slice(0, limit);
}

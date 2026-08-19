import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildContext, llmAnswer, localAnswer, retrievePapers } from "./rag.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultQuestion = "What makes a RAG answer more trustworthy?";
const question = process.argv.slice(2).join(" ").trim() || defaultQuestion;

const papersPath = join(__dirname, "..", "data", "papers.json");
const papers = JSON.parse(await readFile(papersPath, "utf8"));
const retrieved = retrievePapers(question, papers, 3);
const context = buildContext(retrieved);

let answer;
let mode = "local";

try {
  const generated = await llmAnswer(question, context);
  if (generated) {
    answer = generated;
    mode = "llm";
  }
} catch (error) {
  answer = `${localAnswer(question, retrieved).answer}\n\nLLM fallback reason: ${error.message}`;
  mode = "fallback";
}

if (!answer) {
  const local = localAnswer(question, retrieved);
  answer = local.answer;
  mode = local.mode;
}

console.log(`Mini RAG Sobre Papers`);
console.log(`Question: ${question}`);
console.log(`Mode: ${mode}`);
console.log("");
console.log("Retrieved Context:");
console.log(context || "No context retrieved.");
console.log("");
console.log("Answer:");
console.log(answer);

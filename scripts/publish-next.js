import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const noPush = args.has("--no-push");

const configPath = path.join(root, "publish.config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const statePath = path.join(root, config.stateFile);
const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, "utf8"))
  : { published: [], lastPublishedAt: null };

const stagingDir = path.join(root, config.stagingDir);
const publishedDir = path.join(root, config.publishedDir);

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function listProjectDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function assertCleanEnough(projectName) {
  const contextPath = path.join(stagingDir, projectName, config.contextFileName);
  const readmePath = path.join(stagingDir, projectName, "README.md");

  if (config.requireContextFile && !existsSync(contextPath)) {
    throw new Error(`Falta ${config.contextFileName} en ${config.stagingDir}/${projectName}`);
  }

  if (!existsSync(readmePath)) {
    throw new Error(`Falta README.md en ${config.stagingDir}/${projectName}`);
  }
}

function updateMainReadme(projectName) {
  const readmePath = path.join(root, "README.md");
  const readme = readFileSync(readmePath, "utf8");
  const marker = "## Proyectos Publicados";
  const line = `- [${projectName}](projects/${projectName})`;

  if (readme.includes(line)) return;

  const nextReadme = readme.includes(marker)
    ? readme.replace(marker, `${marker}\n\n${line}`)
    : `${readme.trim()}\n\n${marker}\n\n${line}\n`;

  writeFileSync(readmePath, nextReadme, "utf8");
}

function main() {
  mkdirSync(stagingDir, { recursive: true });
  mkdirSync(publishedDir, { recursive: true });

  const candidates = listProjectDirs(stagingDir).filter((name) => !state.published.includes(name));

  if (candidates.length === 0) {
    console.log("No hay proyectos pendientes en staging/.");
    return;
  }

  const projectName = candidates[0];
  const source = path.join(stagingDir, projectName);
  const target = path.join(publishedDir, projectName);

  assertCleanEnough(projectName);

  if (existsSync(target)) {
    throw new Error(`Ya existe ${config.publishedDir}/${projectName}`);
  }

  console.log(`Siguiente proyecto: ${projectName}`);

  if (dryRun) {
    console.log(`Dry run: moveria ${config.stagingDir}/${projectName} a ${config.publishedDir}/${projectName}`);
    return;
  }

  renameSync(source, target);
  updateMainReadme(projectName);

  state.published.push(projectName);
  state.lastPublishedAt = new Date().toISOString();
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  run("git", ["add", "-A", "README.md", config.stateFile, config.stagingDir, config.publishedDir]);
  run("git", ["commit", "-m", `${config.commitPrefix}: add ${projectName}`]);

  if (config.pushAfterCommit && !noPush) {
    run("git", ["push"]);
  }

  console.log(`Publicado: ${projectName}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

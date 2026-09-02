import { readFile } from "node:fs/promises";

const DEFAULT_TEMPLATE_PATH = new URL("../templates/skill.template.md", import.meta.url);

export async function generateSkill(briefText, templateUrl = DEFAULT_TEMPLATE_PATH) {
  const template = await readFile(templateUrl, "utf8");
  const fields = parseBrief(briefText);
  const name = fields.name || titleFromText(fields.task || briefText);
  const task = fields.task || firstSentence(briefText) || `Support the ${name} workflow for AI agents.`;
  const trigger = fields.trigger || `Use when the user asks for help with ${name.toLowerCase()}.`;
  const inputs = toBulletList(fields.inputs || "task brief, user goal, constraints");
  const outputs = toBulletList(fields.outputs || "final answer, assumptions, next steps");
  const constraints = toBulletList(fields.constraints || "stay within the task scope, make uncertainty explicit, avoid unsupported claims");

  const replacements = {
    name,
    description: task,
    whenToUse: trigger,
    inputs,
    workflow: defaultWorkflow(),
    outputFormat: outputs,
    constraints,
    examples: exampleBlock(name, task)
  };

  return renderTemplate(template, replacements);
}

export function parseBrief(text) {
  const fields = {};
  const labelMap = {
    name: "name",
    title: "name",
    task: "task",
    goal: "task",
    trigger: "trigger",
    "when to use": "trigger",
    inputs: "inputs",
    input: "inputs",
    outputs: "outputs",
    output: "outputs",
    constraints: "constraints",
    rules: "constraints"
  };

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z ]+):\s*(.+)$/);
    if (!match) {
      continue;
    }

    const key = labelMap[match[1].trim().toLowerCase()];
    if (key) {
      fields[key] = match[2].trim();
    }
  }

  return fields;
}

function renderTemplate(template, replacements) {
  return template.replace(/{{(\w+)}}/g, (_, key) => replacements[key] || "").trimEnd() + "\n";
}

function titleFromText(text) {
  const words = text
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) {
    return "Custom Agent Skill";
  }

  return words.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

function firstSentence(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?[.!?])\s/);
  return match ? match[1] : normalized;
}

function toBulletList(value) {
  return splitList(value).map((item) => `- ${item}`).join("\n");
}

function splitList(value) {
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultWorkflow() {
  return [
    "1. Read the task brief and identify the user goal.",
    "2. Confirm the available inputs and constraints.",
    "3. Execute the workflow in small, reviewable steps.",
    "4. Produce the requested output format.",
    "5. Check the result against the constraints before returning it."
  ].join("\n");
}

function exampleBlock(name, task) {
  return [
    "Input brief:",
    "",
    "```text",
    `Name: ${name}`,
    `Task: ${task}`,
    "```",
    "",
    "CLI command:",
    "",
    "```bash",
    "node src/index.js generate --brief examples/task-brief.txt --out examples/generated/SKILL.md",
    "```"
  ].join("\n");
}

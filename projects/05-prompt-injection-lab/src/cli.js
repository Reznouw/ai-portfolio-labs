import { runSampleSet, simulatePrompt } from "./simulator.js";

const args = process.argv.slice(2);

if (args.includes("--check")) {
  const results = runSampleSet();
  const hasHighRisk = results.some((item) => item.result.risk === "high" && item.result.blocked);
  const hasLowRisk = results.some((item) => item.result.risk === "low" && !item.result.blocked);
  const allHaveExplanations = results.every((item) => item.result.defenses.active.length > 0);

  if (!hasHighRisk || !hasLowRisk || !allHaveExplanations) {
    console.error("Verification failed: expected high-risk block, low-risk allow, and explanations.");
    process.exit(1);
  }

  console.log(`Verification OK: ${results.length} samples checked.`);
  process.exit(0);
}

const customPrompt = args.join(" ").trim();

if (customPrompt) {
  printResult("Custom Prompt", customPrompt, simulatePrompt(customPrompt));
} else {
  console.log("Prompt Injection Lab");
  console.log("Rule-based toy simulator. No real secrets. No LLM calls.\n");
  for (const sample of runSampleSet()) {
    printResult(sample.title, sample.prompt, sample.result);
  }
}

function printResult(title, prompt, result) {
  console.log(`=== ${title} ===`);
  console.log(`Prompt: ${prompt}`);
  console.log(`Risk: ${result.risk} (${result.score}/100)`);
  console.log(`Decision: ${result.blocked ? "blocked" : "allowed"}`);
  console.log(`Unsafe response: ${result.unsafeToyResponse}`);
  console.log(`Defended response: ${result.defendedToyResponse}`);
  console.log("Why:");
  if (result.matchedRules.length === 0) {
    console.log("- No injection rule matched.");
  } else {
    for (const rule of result.matchedRules) {
      console.log(`- ${rule.label}: ${rule.explanation}`);
    }
  }
  console.log("Defenses:");
  for (const defense of result.defenses.active) {
    console.log(`- ${defense}`);
  }
  console.log("");
}

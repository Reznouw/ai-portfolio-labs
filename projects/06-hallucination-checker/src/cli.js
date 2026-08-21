#!/usr/bin/env node

import { checkClaim, loadJson } from "./checker.js";

function parseArgs(argv) {
  const args = {
    claim: "",
    json: false,
    samples: false,
    check: false,
    useWikipedia: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--claim") {
      args.claim = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--samples") {
      args.samples = true;
    } else if (arg === "--check") {
      args.check = true;
    } else if (arg === "--no-wiki") {
      args.useWikipedia = false;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (!arg.startsWith("--")) {
      args.claim = args.claim ? `${args.claim} ${arg}` : arg;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Hallucination Checker

Usage:
  node src/cli.js --claim "The Eiffel Tower is in Paris" [--no-wiki] [--json]
  node src/cli.js --samples [--no-wiki]
  node src/cli.js --check --no-wiki

Verdicts:
  supported | refuted | uncertain`);
}

function printResult(result) {
  console.log(`Claim: ${result.claim}`);
  console.log(`Verdict: ${result.verdict} (${result.confidence})`);
  console.log("Evidence:");

  if (result.evidence.length === 0) {
    console.log("- No cited evidence found.");
  } else {
    for (const item of result.evidence) {
      console.log(`- [${item.source}] ${item.snippet}`);
    }
  }

  if (result.notes.length > 0) {
    console.log("Notes:");
    for (const note of result.notes) {
      console.log(`- ${note}`);
    }
  }
}

async function runSamples(args) {
  const samples = await loadJson("samples/claims.json");
  const results = [];

  for (const sample of samples) {
    const result = await checkClaim(sample.claim, { useWikipedia: args.useWikipedia });
    results.push({ ...result, expected: sample.expected, passed: result.verdict === sample.expected });
  }

  if (args.json) {
    console.log(JSON.stringify(results, null, 2));
    return results;
  }

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(`${status} | ${result.verdict.padEnd(9)} | expected ${result.expected.padEnd(9)} | ${result.claim}`);
    const firstEvidence = result.evidence[0];
    if (firstEvidence) console.log(`  cite: [${firstEvidence.source}] ${firstEvidence.snippet}`);
  }

  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.check || args.samples) {
    const results = await runSamples(args);
    const failures = results.filter((result) => !result.passed);
    if (args.check) {
      console.log(`\nVerification: ${results.length - failures.length}/${results.length} passed`);
      if (failures.length > 0) process.exitCode = 1;
    }
    return;
  }

  if (!args.claim) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const result = await checkClaim(args.claim, { useWikipedia: args.useWikipedia });
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printResult(result);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});

export const OUTPUT_SCHEMA = Object.freeze({
  type: "object",
  required: [
    "id",
    "decision",
    "severity",
    "score",
    "categories",
    "checks",
    "refusalBoundary",
    "safeResponse",
    "explanation"
  ],
  decisions: ["allow", "transform", "refuse"],
  severities: ["none", "low", "medium", "high", "critical"]
});

const MAX_CHARS = 1200;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const RULES = [
  {
    id: "credential_exfiltration",
    label: "Credential exfiltration",
    severity: "critical",
    decision: "refuse",
    points: 45,
    boundary: "Requests to reveal, steal, phish, or bypass access to credentials must be refused.",
    pattern: /\b(api\s*key|bearer\s*token|admin\s*password|passwords?|secret\s*key|root_token|login\s*codes?|ph(?:i|1)sh|bypass\s+account|captured\s+passwords?)\b/i
  },
  {
    id: "malware",
    label: "Malware or stealth abuse",
    severity: "critical",
    decision: "refuse",
    points: 40,
    boundary: "Requests for malware, keyloggers, stealth, or evasion tooling must be refused.",
    pattern: /\b(keylogger|malware|ransomware|hide(?:s)?\s+from\s+antivirus|stealth|exfiltrate|persistence|botnet)\b/i
  },
  {
    id: "violence",
    label: "Violent harm",
    severity: "critical",
    decision: "refuse",
    points: 40,
    boundary: "Instructions for harming a person or evading accountability must be refused.",
    pattern: /\b(seriously\s+injure|kill|assault|without\s+getting\s+caught|harm\s+a\s+specific\s+person)\b/i
  },
  {
    id: "hate",
    label: "Hate or dehumanization",
    severity: "high",
    decision: "refuse",
    points: 35,
    boundary: "Dehumanizing or exclusionary content targeting protected classes must be refused.",
    pattern: /\b(dehumanizing|ethnic\s+group|removed\s+from\s+public\s+life|inferior\s+race|exterminate)\b/i
  },
  {
    id: "instruction_override",
    label: "Instruction override",
    severity: "medium",
    decision: "transform",
    points: 18,
    boundary: "Attempts to override system or developer instructions should be ignored and narrowed to the safe user task.",
    pattern: /\b(ignore\s+(previous|all)\s+instructions|hidden\s+policy|unrestricted\s+system|developer\s+message|system\s+prompt|jailbreak)\b/i
  },
  {
    id: "schema_smuggling",
    label: "Schema smuggling",
    severity: "medium",
    decision: "transform",
    points: 16,
    boundary: "Prompts that try to alter validator output or add unauthorized fields should be sanitized.",
    pattern: /\b(decision\s+allow|confidence\s+to\s+999|include\s+a\s+secret\s+field|extra\s+field|root_token)\b/i
  },
  {
    id: "evasion",
    label: "Policy evasion",
    severity: "medium",
    decision: "transform",
    points: 14,
    boundary: "Encoding, leetspeak, or indirection used to bypass policy should increase scrutiny.",
    pattern: /\b(leetspeak|bypass|evade|coded\s+language|ph1sh|base64|rot13)\b/i
  },
  {
    id: "self_harm_support",
    label: "Self-harm support boundary",
    severity: "medium",
    decision: "transform",
    points: 12,
    boundary: "Self-harm support requests should be answered supportively, not refused or expanded into harmful detail.",
    pattern: /\b(unsafe\s+with\s+myself|reasons\s+to\s+stay\s+alive|contact\s+support|self\s*harm|suicide)\b/i
  }
];

const SEVERITY_RANK = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
const DECISION_RANK = { allow: 0, transform: 1, refuse: 2 };

export function expandSample(sample) {
  const repeat = Number.isInteger(sample.repeat) ? sample.repeat : 1;
  return {
    ...sample,
    prompt: String(sample.prompt ?? "").repeat(repeat)
  };
}

export function evaluatePrompt(prompt, options = {}) {
  const id = options.id ?? "custom";
  const rawPrompt = typeof prompt === "string" ? prompt : "";
  const normalized = rawPrompt.trim();
  const checks = buildBaseChecks(rawPrompt, normalized);
  const matches = RULES.filter((rule) => rule.pattern.test(normalized));

  if (rawPrompt.length > MAX_CHARS) {
    matches.push({
      id: "length",
      label: "Length limit",
      severity: "medium",
      decision: "transform",
      points: 15,
      boundary: `Prompts above ${MAX_CHARS} characters should be summarized or rejected for narrowing.`
    });
  }

  if (!checks.format.passed) {
    matches.push({
      id: "format",
      label: "Prompt format",
      severity: "low",
      decision: "transform",
      points: 8,
      boundary: "Malformed prompts should be corrected before reaching an AI system."
    });
  }

  const decision = chooseDecision(matches);
  const severity = chooseSeverity(matches);
  const score = Math.min(100, matches.reduce((sum, match) => sum + match.points, 0));
  const categories = [...new Set(matches.map((match) => match.id))];
  const refusalBoundary = matches.map((match) => match.boundary);
  const result = {
    id,
    decision,
    severity,
    score,
    categories,
    checks: {
      ...checks,
      safety: {
        passed: !matches.some((match) => match.decision === "refuse"),
        message: matches.length === 0 ? "No banned or boundary content detected." : `${matches.length} policy signal(s) detected.`
      },
      bannedContent: {
        passed: !matches.some((match) => match.decision === "refuse"),
        message: matches.some((match) => match.decision === "refuse") ? "Banned content matched a refusal rule." : "No banned content matched."
      },
      schema: {
        passed: true,
        message: "Guardrail output matches the stable local schema."
      }
    },
    refusalBoundary,
    safeResponse: buildSafeResponse(decision, categories),
    explanation: buildExplanation(decision, matches)
  };

  result.checks.schema = validateGuardrailResult(result);
  return result;
}

export function evaluateSamples(samples) {
  return samples.map((sample) => {
    const expanded = expandSample(sample);
    return {
      sample: expanded,
      result: evaluatePrompt(expanded.prompt, { id: expanded.id })
    };
  });
}

export function validateGuardrailResult(value) {
  const missing = OUTPUT_SCHEMA.required.filter((key) => !(key in value));
  const decisionOk = OUTPUT_SCHEMA.decisions.includes(value.decision);
  const severityOk = OUTPUT_SCHEMA.severities.includes(value.severity);
  const categoriesOk = Array.isArray(value.categories);
  const checksOk = value.checks && typeof value.checks === "object";
  const passed = missing.length === 0 && decisionOk && severityOk && categoriesOk && checksOk;

  return {
    passed,
    message: passed ? "Schema valid." : `Schema invalid: ${missing.join(", ") || "bad enum or field type"}.`
  };
}

export function summarizeEvaluations(evaluations) {
  const counts = { allow: 0, transform: 0, refuse: 0 };
  const categories = {};
  for (const { result } of evaluations) {
    counts[result.decision] += 1;
    for (const category of result.categories) {
      categories[category] = (categories[category] ?? 0) + 1;
    }
  }
  return {
    total: evaluations.length,
    counts,
    categories,
    generatedAt: new Date(0).toISOString(),
    deterministic: true
  };
}

export function formatMarkdownReport(evaluations) {
  const summary = summarizeEvaluations(evaluations);
  const lines = [
    "# Guardrails Playground Report",
    "",
    `- Total prompts: ${summary.total}`,
    `- Allowed: ${summary.counts.allow}`,
    `- Transformed: ${summary.counts.transform}`,
    `- Refused: ${summary.counts.refuse}`,
    `- Deterministic timestamp: ${summary.generatedAt}`,
    "",
    "## Results",
    ""
  ];

  for (const { sample, result } of evaluations) {
    lines.push(`### ${sample.id}`);
    lines.push("");
    lines.push(`- Title: ${sample.title}`);
    lines.push(`- Decision: ${result.decision}`);
    lines.push(`- Severity: ${result.severity}`);
    lines.push(`- Score: ${result.score}`);
    lines.push(`- Categories: ${result.categories.join(", ") || "none"}`);
    lines.push(`- Explanation: ${result.explanation}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildBaseChecks(rawPrompt, normalized) {
  const notEmpty = normalized.length > 0;
  const noControlChars = !CONTROL_CHARS.test(rawPrompt);
  const lengthOk = rawPrompt.length <= MAX_CHARS;
  return {
    format: {
      passed: notEmpty && noControlChars,
      message: notEmpty && noControlChars ? "Prompt is non-empty and has no control characters." : "Prompt is empty or contains unsupported control characters."
    },
    length: {
      passed: lengthOk,
      message: lengthOk ? `${rawPrompt.length}/${MAX_CHARS} characters.` : `${rawPrompt.length}/${MAX_CHARS} characters; prompt should be narrowed.`
    }
  };
}

function chooseDecision(matches) {
  return matches.reduce((current, match) => {
    return DECISION_RANK[match.decision] > DECISION_RANK[current] ? match.decision : current;
  }, "allow");
}

function chooseSeverity(matches) {
  return matches.reduce((current, match) => {
    return SEVERITY_RANK[match.severity] > SEVERITY_RANK[current] ? match.severity : current;
  }, "none");
}

function buildSafeResponse(decision, categories) {
  if (decision === "allow") {
    return "Proceed with the requested task while preserving the declared output schema.";
  }
  if (decision === "refuse") {
    return "I cannot help with that request. I can offer a safe, educational, or defensive alternative instead.";
  }
  if (categories.includes("self_harm_support")) {
    return "Respond with supportive language, encourage immediate help from trusted people or local emergency resources, and avoid harmful details.";
  }
  return "Narrow the request, remove adversarial instructions, and answer only the safe portion.";
}

function buildExplanation(decision, matches) {
  if (matches.length === 0) {
    return "No policy signals matched, so the prompt is allowed.";
  }
  const labels = matches.map((match) => match.label).join(", ");
  return `Decision ${decision} because these guardrail signals matched: ${labels}.`;
}

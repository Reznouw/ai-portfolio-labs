export function approximateTokens(text) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(String(text).trim().split(/\s+/).length * 1.33));
}

export function estimateCostUsd({ inputText, outputText, pricing }) {
  const inputTokens = approximateTokens(inputText);
  const outputTokens = approximateTokens(outputText);
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedUsd: Number((inputCost + outputCost).toFixed(6))
  };
}

export function normalizeResult({ provider, task, raw, latencyMs, error }) {
  const outputText = raw?.text || "";
  const cost = estimateCostUsd({
    inputText: task.prompt,
    outputText,
    pricing: provider.pricing
  });

  return {
    providerId: provider.id,
    providerName: provider.name,
    model: raw?.model || provider.model,
    status: error ? "error" : raw?.status || "ok",
    latencyMs,
    cost,
    outputText,
    notes: raw?.notes || [],
    error: error ? String(error.message || error) : null
  };
}

export function rankResults(results) {
  return [...results].sort((a, b) => {
    if (a.status !== b.status) return a.status === "ok" ? -1 : 1;
    if (a.cost.estimatedUsd !== b.cost.estimatedUsd) {
      return a.cost.estimatedUsd - b.cost.estimatedUsd;
    }
    return a.latencyMs - b.latencyMs;
  });
}

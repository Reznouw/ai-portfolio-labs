export async function refineWithLlm({ ocrText, extracted }) {
  const endpoint = process.env.OCR_LLM_ENDPOINT;
  if (!endpoint) {
    return {
      result: extracted,
      metadata: { skipped: true, reason: "OCR_LLM_ENDPOINT is not configured." }
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OCR_LLM_TIMEOUT_MS || 12000));

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: compactObject({
        "content-type": "application/json",
        authorization: process.env.OCR_LLM_API_KEY ? `Bearer ${process.env.OCR_LLM_API_KEY}` : undefined
      }),
      body: JSON.stringify({
        model: process.env.OCR_LLM_MODEL || "local-refiner",
        instruction: "Refine extracted OCR fields. Return corrected structured JSON only.",
        ocrText,
        extracted
      })
    });

    if (!response.ok) throw new Error(`LLM endpoint returned ${response.status}`);
    const payload = await response.json();
    return {
      result: payload.fields ? { ...extracted, fields: { ...extracted.fields, ...payload.fields } } : payload,
      metadata: { skipped: false, endpoint, model: process.env.OCR_LLM_MODEL || "local-refiner" }
    };
  } catch (error) {
    return {
      result: extracted,
      metadata: { skipped: false, error: error.message }
    };
  } finally {
    clearTimeout(timeout);
  }
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

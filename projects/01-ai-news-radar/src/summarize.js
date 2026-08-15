const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function summarizeItem(item) {
  if (!OPENAI_API_KEY) {
    return localSummary(item);
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Resume noticias de IA en espanol claro. Se factual, breve y evita hype."
          },
          {
            role: "user",
            content: `Titulo: ${item.title}\nFuente: ${item.source}\nTexto: ${item.description || "Sin descripcion"}\n\nDevuelve JSON valido con keys summary y why_it_matters. Maximo 35 palabras por campo.`
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      summary: parsed.summary || localSummary(item).summary,
      whyItMatters: parsed.why_it_matters || localSummary(item).whyItMatters,
      mode: "llm"
    };
  } catch (error) {
    return { ...localSummary(item), mode: "fallback", error: error.message };
  }
}

function localSummary(item) {
  const text = stripHtml(item.description || item.title || "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean);
  const summary = words.slice(0, 28).join(" ") || item.title;
  const whyItMatters = inferWhyItMatters(`${item.title} ${text}`);

  return {
    summary: summary.endsWith(".") ? summary : `${summary}.`,
    whyItMatters,
    mode: "local"
  };
}

function inferWhyItMatters(text) {
  const lower = text.toLowerCase();

  if (lower.includes("agent")) return "Importa porque muestra hacia donde avanzan los sistemas autonomos y herramientas de productividad con IA.";
  if (lower.includes("rag") || lower.includes("retrieval")) return "Importa porque conecta modelos con informacion externa, una pieza clave para apps utiles y verificables.";
  if (lower.includes("chip") || lower.includes("gpu")) return "Importa porque la infraestructura define costos, velocidad y acceso a modelos avanzados.";
  if (lower.includes("open source")) return "Importa porque puede reducir barreras de entrada para desarrolladores y comunidades.";
  if (lower.includes("safety") || lower.includes("security")) return "Importa porque seguridad y confianza son requisitos para usar IA en produccion.";

  return "Importa porque refleja una tendencia reciente que puede afectar productos, investigacion o adopcion de IA.";
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

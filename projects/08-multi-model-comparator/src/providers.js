const DEFAULT_PRICING = {
  inputPerMillion: 0,
  outputPerMillion: 0
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compactCriteria(task) {
  return Array.isArray(task.criteria) && task.criteria.length > 0
    ? task.criteria.join(", ")
    : "no explicit criteria";
}

function trimWords(text, maxWords) {
  const words = text.trim().split(/\s+/);
  if (!maxWords || words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function buildMessages(task) {
  return [
    {
      role: "system",
      content: "You are a concise assistant. Return a direct answer that satisfies the provided criteria."
    },
    {
      role: "user",
      content: `Title: ${task.title || "Untitled"}\nCriteria: ${compactCriteria(task)}\nTask: ${task.prompt}`
    }
  ];
}

async function postJson(url, { headers, body, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (!response.ok) {
      const message = json?.error?.message || json?.message || response.statusText;
      throw new Error(`${response.status} ${message}`);
    }

    return json;
  } finally {
    clearTimeout(timeout);
  }
}

function skippedMissingKey(provider, keyName) {
  return {
    model: provider.model,
    status: "skipped",
    text: "",
    notes: [`Missing ${keyName}; provider skipped.`]
  };
}

export const providers = {
  "mock-fast": {
    id: "mock-fast",
    name: "Mock Fast",
    model: "local-mock-fast-v1",
    pricing: DEFAULT_PRICING,
    async run(task) {
      await sleep(90);
      const text = [
        "Ship a small beta first.",
        "Confirm the app runs offline or explains clearly when it needs network access.",
        "Add a plain onboarding screen, sample data, export, and recovery path.",
        "Log failures locally without collecting private user content.",
        "Publish a checklist for privacy, support, backups, and rollback before launch."
      ].join(" ");

      return {
        model: this.model,
        text: trimWords(text, task.maxOutputWords),
        notes: ["Optimized for short latency and directness."]
      };
    }
  },

  "mock-careful": {
    id: "mock-careful",
    name: "Mock Careful",
    model: "local-mock-careful-v1",
    pricing: DEFAULT_PRICING,
    async run(task) {
      await sleep(180);
      const text = [
        "1. Define the promise in one sentence and test it with five non-technical users.",
        "2. Verify install, first run, offline behavior, data deletion, and export.",
        "3. Show what data stays local and what, if anything, leaves the device.",
        "4. Add safe defaults, human-readable errors, and a support contact.",
        "5. Prepare rollback notes, known limitations, and a simple incident checklist.",
        "6. Launch to a small cohort, review feedback, then widen access."
      ].join("\n");

      return {
        model: this.model,
        text: trimWords(text, task.maxOutputWords),
        notes: ["Emphasizes risk, trust, and release sequencing."]
      };
    }
  },

  "mock-creative": {
    id: "mock-creative",
    name: "Mock Creative",
    model: "local-mock-creative-v1",
    pricing: DEFAULT_PRICING,
    async run(task) {
      await sleep(140);
      const text = [
        "Treat launch like inviting users into a workshop, not dropping software on them.",
        "Give them a demo project, a panic button, and a one-page trust label explaining data, limits, and recovery.",
        "Before release, rehearse the ugly paths: bad input, no internet, corrupted files, confused users, and support overload.",
        "Launch when the first ten users can finish the core job, understand what the AI did, and leave with their data intact."
      ].join(" ");

      return {
        model: this.model,
        text: trimWords(text, task.maxOutputWords),
        notes: ["Uses a product metaphor to make launch readiness memorable."]
      };
    }
  },

  openai: {
    id: "openai",
    name: "OpenAI",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6
    },
    async run(task, options) {
      if (!process.env.OPENAI_API_KEY) return skippedMissingKey(this, "OPENAI_API_KEY");

      const json = await postJson("https://api.openai.com/v1/chat/completions", {
        timeoutMs: options.timeoutMs,
        headers: {
          authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: {
          model: this.model,
          messages: buildMessages(task),
          temperature: 0.2
        }
      });

      return {
        model: json.model || this.model,
        text: json.choices?.[0]?.message?.content || "",
        notes: ["Real OpenAI response."]
      };
    }
  },

  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    pricing: {
      inputPerMillion: 0.15,
      outputPerMillion: 0.6
    },
    async run(task, options) {
      if (!process.env.OPENROUTER_API_KEY) return skippedMissingKey(this, "OPENROUTER_API_KEY");

      const json = await postJson("https://openrouter.ai/api/v1/chat/completions", {
        timeoutMs: options.timeoutMs,
        headers: {
          authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost",
          "X-Title": "Multi-Model Comparator"
        },
        body: {
          model: this.model,
          messages: buildMessages(task),
          temperature: 0.2
        }
      });

      return {
        model: json.model || this.model,
        text: json.choices?.[0]?.message?.content || "",
        notes: ["Real OpenRouter response."]
      };
    }
  },

  gemini: {
    id: "gemini",
    name: "Gemini",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    pricing: {
      inputPerMillion: 0.075,
      outputPerMillion: 0.3
    },
    async run(task, options) {
      if (!process.env.GEMINI_API_KEY) return skippedMissingKey(this, "GEMINI_API_KEY");

      const prompt = `Title: ${task.title || "Untitled"}\nCriteria: ${compactCriteria(task)}\nTask: ${task.prompt}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const json = await postJson(url, {
        timeoutMs: options.timeoutMs,
        body: {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        }
      });

      return {
        model: this.model,
        text: json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "",
        notes: ["Real Gemini-style response."]
      };
    }
  }
};

export function getProvider(id) {
  return providers[id] || null;
}

export function listProviderIds() {
  return Object.keys(providers);
}

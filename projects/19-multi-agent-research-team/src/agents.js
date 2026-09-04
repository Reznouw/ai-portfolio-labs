const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'city', 'during', 'for', 'from',
  'in', 'into', 'is', 'it', 'of', 'on', 'or', 'over', 'should', 'the', 'to', 'with'
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function uniqueSorted(words) {
  return [...new Set(words)].sort();
}

function scoreDocument(topicTerms, document) {
  const sourceText = [document.title, document.sourceType, document.stance, document.passage].join(' ');
  const documentTerms = new Set(tokenize(sourceText));
  const matches = topicTerms.filter((term) => documentTerms.has(term));
  const stanceBoost = document.stance === 'mixed' ? 1 : 0;
  return {
    ...document,
    score: matches.length + stanceBoost,
    matchedTerms: matches
  };
}

export function researcher(topic, corpus, limit = 5) {
  const topicTerms = uniqueSorted(tokenize(topic));
  const selectedEvidence = corpus
    .map((document) => scoreDocument(topicTerms, document))
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);

  return {
    agent: 'researcher',
    topicTerms,
    selectedEvidence,
    note: `Selected ${selectedEvidence.length} evidence items from ${corpus.length} local sources.`
  };
}

export function critic(topic, selectedEvidence) {
  const stances = selectedEvidence.reduce((counts, evidence) => {
    counts[evidence.stance] = (counts[evidence.stance] || 0) + 1;
    return counts;
  }, {});
  const sourceTypes = new Set(selectedEvidence.map((evidence) => evidence.sourceType));
  const notes = [];

  if ((stances.supporting || 0) >= 2) {
    notes.push('Evidence has multiple supporting sources, but impact claims still depend on local implementation quality.');
  }
  if ((stances.cautionary || 0) > 0) {
    notes.push('Cautionary sources identify cost, staffing, and operational reliability as deployment risks.');
  }
  if ((stances.mixed || 0) > 0) {
    notes.push('Community feedback supports the idea while warning that site placement can create equity gaps.');
  }
  if (sourceTypes.size < 3) {
    notes.push('Source diversity is limited; add more independent evidence before making a final policy decision.');
  }

  return {
    agent: 'critic',
    topic,
    stanceCounts: stances,
    sourceTypeCount: sourceTypes.size,
    notes,
    verdict: notes.length > 0 ? 'usable with caveats' : 'insufficient review'
  };
}

function citationList(evidenceItems) {
  return evidenceItems.map((evidence) => `[${evidence.id}]`).join(' ');
}

function buildRecommendation(selectedEvidence, review) {
  const hasSupport = selectedEvidence.some((evidence) => evidence.stance === 'supporting');
  const hasCaution = selectedEvidence.some((evidence) => evidence.stance === 'cautionary');

  if (hasSupport && hasCaution) {
    return `Deploy cooling hubs as a targeted heat-risk intervention, but gate expansion on staffing, site access, and cost controls ${citationList(selectedEvidence)}.`;
  }
  if (hasSupport) {
    return `Deploy a limited pilot because the available local evidence is mostly supportive ${citationList(selectedEvidence)}.`;
  }
  return `Do not proceed beyond planning until stronger evidence is available. Critic verdict: ${review.verdict}.`;
}

export function writer(topic, research, review) {
  const evidence = research.selectedEvidence;
  const recommendation = buildRecommendation(evidence, review);
  const keyFindings = evidence.slice(0, 4).map((item) => ({
    citation: item.id,
    finding: item.passage,
    stance: item.stance
  }));

  const markdown = [
    '# Research Brief',
    '',
    `## Topic`,
    topic,
    '',
    '## Recommendation',
    recommendation,
    '',
    '## Key Findings',
    ...keyFindings.map((item) => `- ${item.finding} [${item.citation}]`),
    '',
    '## Critic Notes',
    ...review.notes.map((note) => `- ${note}`),
    '',
    '## Citations',
    ...evidence.map((item) => `- [${item.id}] ${item.title}. ${item.sourceType}. ${item.date}. ${item.url}`),
    '',
    '## Agent Trace',
    `- researcher: ${research.note}`,
    `- critic: verdict is ${review.verdict}; source type count is ${review.sourceTypeCount}.`,
    '- writer: assembled recommendation, findings, citations, and critic notes.'
  ].join('\n');

  return {
    agent: 'writer',
    topic,
    recommendation,
    keyFindings,
    citations: evidence.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      date: item.date,
      sourceType: item.sourceType
    })),
    criticNotes: review.notes,
    markdown
  };
}

export function runResearchTeam(topic, corpus) {
  const research = researcher(topic, corpus);
  const review = critic(topic, research.selectedEvidence);
  const brief = writer(topic, research, review);

  return {
    topic,
    recommendation: brief.recommendation,
    keyFindings: brief.keyFindings,
    citations: brief.citations,
    criticNotes: brief.criticNotes,
    agentTrace: [
      { agent: research.agent, note: research.note, selectedIds: research.selectedEvidence.map((item) => item.id) },
      { agent: review.agent, verdict: review.verdict, notes: review.notes },
      { agent: brief.agent, note: 'Wrote Markdown and JSON research brief.' }
    ],
    debug: {
      topicTerms: research.topicTerms,
      selectedEvidence: research.selectedEvidence.map((item) => ({
        id: item.id,
        score: item.score,
        matchedTerms: item.matchedTerms,
        stance: item.stance
      }))
    },
    markdown: brief.markdown
  };
}

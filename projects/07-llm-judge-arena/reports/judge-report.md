# LLM Judge Arena Report

Generated at: 2026-08-15T22:11:05.354Z

## Summary

- Prompts: 3
- Candidates: 6
- Average correctness: 0.472
- Average helpfulness: 0.763
- Average grounding: 0.373
- Average overall: 0.515

## Prompt Results

### prompt-001: Photosynthesis explanation

Prompt: Explain photosynthesis to a middle school student in 4 sentences or fewer.

Winner: candidate-clear (answer-a) with overall 0.794

#### candidate-clear (answer-a)

Photosynthesis is how plants make their own food. They use sunlight, carbon dioxide from the air, and water from the soil to make sugar. The sugar stores energy for growth, and oxygen is released into the air. In simple terms, sunlight helps plants turn air and water into food.

Scores: correctness=1, helpfulness=0.875, grounding=0.417, overall=0.794

Matched facts: carbon dioxide, water, light, sugar, oxygen

Missing facts: none

Forbidden claims: none

#### candidate-vague (answer-b)

Photosynthesis is when plants eat soil and breathe oxygen to stay alive. It mostly happens at night when plants rest. The process gives plants vitamins.

Scores: correctness=0, helpfulness=0.5, grounding=0.267, overall=0.205

Matched facts: oxygen

Missing facts: carbon dioxide, water, light, sugar

Forbidden claims: plants eat soil

### prompt-002: Refund policy answer

Prompt: A customer asks if they can get a refund 20 days after buying a course. Answer using only the policy context.

Winner: candidate-policy-grounded (answer-a) with overall 0.786

#### candidate-policy-grounded (answer-a)

Based on the policy, a refund is not available 20 days after purchase because refunds only apply for 14 calendar days and only if less than 25 percent of the course was completed. The customer may still request account credit within 30 days by contacting support@example.test.

Scores: correctness=0.833, helpfulness=1, grounding=0.538, overall=0.786

Matched facts: 14 calendar days, less than 25 percent, not available, account credit, 30 days

Missing facts: after 14 days

Forbidden claims: none

#### candidate-overpromises (answer-b)

Yes, they can get a full refund after 20 days as long as they are unhappy. They should call the bank or email support@example.com to reverse the charge.

Scores: correctness=0, helpfulness=0.625, grounding=0.071, overall=0.178

Matched facts: none

Missing facts: 14 calendar days, less than 25 percent, after 14 days, not available, account credit, 30 days

Forbidden claims: full refund after 20 days, call the bank, support@example.com

### prompt-003: RAG definition

Prompt: Define retrieval augmented generation and mention one limitation.

Winner: candidate-balanced (answer-a) with overall 0.948

#### candidate-balanced (answer-a)

Retrieval augmented generation combines a retriever and a generator: the retriever finds relevant external documents, and the generator uses that context to answer. One limitation is that the answer can be weak or wrong if retrieval misses important evidence or returns low quality context.

Scores: correctness=1, helpfulness=1, grounding=0.826, overall=0.948

Matched facts: retriever, generator, external documents, context, retrieval misses important evidence

Missing facts: none

Forbidden claims: none

#### candidate-hallucinates (answer-b)

RAG is a model that stores all facts in model weights so it does not need documents. It guarantees factual answers because the generator already knows the right content.

Scores: correctness=0, helpfulness=0.575, grounding=0.118, overall=0.179

Matched facts: generator

Missing facts: retriever, external documents, context, retrieval misses important evidence

Forbidden claims: stores all facts in model weights, guarantees factual answers, does not need documents


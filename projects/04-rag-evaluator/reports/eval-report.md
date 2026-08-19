# RAG Evaluation Report

Generated at: 2026-08-15T21:19:08.578Z

## Summary

- Items: 4
- Exact: 0
- Keyword: 0.95
- Groundedness: 0.641
- Overall: 0.636

## Results

### qa-001: Attention Is All You Need

Question: What is the main architectural change introduced by the Transformer?

Expected: The Transformer replaces recurrent and convolutional layers with stacked self-attention mechanisms in the encoder and decoder.

Generated: The Transformer removes recurrence and convolutions and relies on stacked self-attention in its encoder and decoder.

Scores: exact=0, keyword=1, groundedness=0.778, overall=0.711

### qa-002: Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks

Question: Why does RAG combine a parametric model with retrieved documents?

Expected: RAG combines a seq2seq parametric model with a dense retrieved document index so generation can use both learned knowledge and external non-parametric memory.

Generated: RAG pairs a pretrained seq2seq model with a dense Wikipedia index so answers can draw on learned parameters and retrieved non-parametric memory.

Scores: exact=0, keyword=1, groundedness=0.467, overall=0.587

### qa-003: BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding

Question: What makes BERT bidirectional during pre-training?

Expected: BERT uses masked language modeling so each layer can condition on both left and right context during pre-training.

Generated: BERT is bidirectional because masked language modeling lets it use both left and right context in all layers while pre-training.

Scores: exact=0, keyword=1, groundedness=0.917, overall=0.767

### qa-004: LoRA: Low-Rank Adaptation of Large Language Models

Question: What is the efficiency idea behind LoRA?

Expected: LoRA freezes pretrained weights and trains small low-rank decomposition matrices, reducing the number of trainable parameters.

Generated: LoRA keeps the pretrained weights frozen and adds trainable low-rank matrices, which cuts the trainable parameter count for downstream tasks.

Scores: exact=0, keyword=0.8, groundedness=0.4, overall=0.48


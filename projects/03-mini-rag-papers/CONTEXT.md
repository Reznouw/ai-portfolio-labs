# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un mini-proyecto ejecutable llamado Mini RAG Sobre Papers que ensena el flujo minimo de Retrieval-Augmented Generation sobre 5 abstracts cortos de papers de IA, con respuesta citada y fallback local sin credenciales.

## Arquitectura

- `data/papers.json`: dataset pequeno con 5 abstracts markdown y metadatos.
- `src/rag.js`: contiene retrieval por tokens/temas, ensamblado de contexto, generacion via API compatible con OpenAI y fallback local.
- `src/index.js`: CLI que recibe una pregunta, recupera los 3 papers mas relevantes, arma contexto y muestra respuesta.
- `package.json`: scripts `start` y `test` sobre Node.js puro.
- `.env.example`: variables opcionales para activar LLM.

## Decisiones Tomadas

- Node.js puro sin dependencias para mantener instalacion rapida y portable.
- Dataset en JSON con abstracts markdown para evitar PDFs pesados.
- Retrieval simple y legible en vez de embeddings para que el objetivo didactico sea claro.
- LLM opcional mediante API compatible con OpenAI; fallback local obligatorio para que el proyecto siempre corra.

## Como Ejecutar

```bash
npm install
npm start -- "How does retrieval help reduce hallucinations?"
npm test
```

## Verificacion

- `npm test`: OK, ejecuta la pregunta de ejemplo, recupera contexto y responde en modo local sin API key.
- Pendiente verificar con una API key real compatible con OpenAI.

## Pendientes

- Agregar UI local si el portfolio necesita una demo visual.
- Agregar evaluacion automatica de faithfulness si el alcance crece.

## Notas Para El Siguiente Agente

Mantener este proyecto pequeno. Si se agregan embeddings o UI, conservar el CLI y el fallback local para que siga siendo demostrable sin servicios externos.

## Historial De Cambios

- 2026-08-15: creado mini-proyecto con dataset, CLI RAG, LLM opcional, fallback local y documentacion.

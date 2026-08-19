# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un mini-proyecto ejecutable llamado RAG Evaluator. Ensena como evaluar respuestas generadas para preguntas sobre papers usando metricas simples: exact match, cobertura de keywords y groundedness contra contexto recuperado.

## Arquitectura

- `data/paper-qa.json`: dataset pequeno con preguntas, contexto recuperado, respuesta esperada, respuesta generada y keywords requeridas.
- `src/evaluate.js`: carga el dataset, calcula metricas por ejemplo, agrega promedios y genera reportes JSON y Markdown.
- `reports/`: carpeta creada al ejecutar `npm run eval` con los reportes generados.
- `package.json`: scripts locales sin dependencias externas.

## Decisiones Tomadas

- Node.js puro sin dependencias para que el proyecto funcione sin API keys ni servicios pagos.
- Dataset embebido con respuestas generadas de muestra para que la evaluacion sea reproducible.
- Groundedness implementado como proxy lexical contra el contexto recuperado, suficiente para un demo pequeno pero no equivalente a verificacion semantica completa.
- Reporte en JSON y Markdown para servir tanto a maquinas como a lectura humana.

## Como Ejecutar

```bash
npm install
npm run eval
```

## Verificacion

- `npm run eval`: OK, genera reportes en `reports/eval-report.json` y `reports/eval-report.md`.

## Pendientes

- Agregar comparacion entre multiples archivos de respuestas si se quiere evaluar mas de un modelo.
- Agregar thresholds de CI si el proyecto se publica como ejemplo de evaluacion automatizada.

## Notas Para El Siguiente Agente

Mantener el proyecto pequeno y local-first. Si se agrega LLM-as-judge, debe ser opcional y conservar este modo sin API.

## Historial De Cambios

- 2026-08-15: creado mini-proyecto RAG Evaluator con dataset, metricas y reporte ejecutable.

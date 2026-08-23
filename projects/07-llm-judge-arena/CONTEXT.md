# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un mini-proyecto ejecutable llamado LLM Judge Arena. Demuestra el concepto LLM-as-judge comparando dos respuestas candidatas por prompt, pero usa un juez local deterministico basado en rubricas para no depender de APIs pagas.

## Arquitectura

- `data/arena-samples.json`: prompts de muestra, contexto, rubrica y dos respuestas candidatas por prompt.
- `src/judge.js`: juez local que calcula correctness, helpfulness y grounding, elige ganador y genera reportes.
- `reports/`: carpeta creada al ejecutar el juez con reportes JSON y Markdown.
- `package.json`: scripts locales sin dependencias externas.
- `README.md`: instrucciones, verificacion y variables opcionales OpenAI-compatible.

## Decisiones Tomadas

- Node.js puro sin dependencias para mantener el proyecto portable.
- Juez deterministico local como modo por defecto para evitar costos, claves y no determinismo.
- Rubrica explicita por prompt para que las razones de scoring sean auditables.
- Reportes en JSON y Markdown para cubrir consumo automatico y lectura humana.
- Variables OpenAI-compatible solo documentadas como extension futura, no usadas por defecto.

## Como Ejecutar

```bash
npm install
npm run judge
npm run verify
```

## Verificacion

- `npm run verify`: ejecuta el juez, valida estructura y rangos de scores, y genera `reports/judge-report.json` y `reports/judge-report.md`.

## Pendientes

- Agregar modo opcional de juez remoto manteniendo el juez local como fallback por defecto.
- Agregar thresholds configurables por metrica si se usa en CI.
- Agregar mas categorias de prompts para evaluar estilos de respuesta distintos.

## Notas Para El Siguiente Agente

No introducir dependencias externas ni llamadas remotas en el flujo por defecto. Si se agrega integracion OpenAI-compatible, debe ser opt-in por variables de entorno y conservar `npm run verify` sin red.

## Historial De Cambios

- 2026-08-15: creado mini-proyecto LLM Judge Arena con dataset, juez local, reportes y verificacion.

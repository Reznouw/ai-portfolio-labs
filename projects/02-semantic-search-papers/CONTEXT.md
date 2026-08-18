# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un mini-proyecto ejecutable llamado Semantic Search De Papers que ensene embeddings y busqueda semantica sobre metadatos de papers tipo arXiv usando un fallback local sin APIs pagadas.

## Arquitectura

- `data/sample-papers.json`: dataset pequeno y autocontenido con metadatos de papers ficticios.
- `data/index.json`: indice generado por `npm run ingest` con vocabulario, IDF y vectores TF-IDF normalizados.
- `src/search-core.js`: funciones puras de tokenizacion, TF-IDF, coseno e indexacion.
- `src/ingest.js`: CLI de ingesta que lee el dataset y escribe el indice.
- `src/search.js`: CLI de busqueda que carga el indice y rankea resultados.
- `package.json`: scripts `ingest`, `search` y `verify`.

## Decisiones Tomadas

- Node.js puro para mantener el proyecto pequeno y sin dependencias externas.
- TF-IDF con similitud coseno como embedding baseline local y explicable.
- Dataset local en vez de API live para que el proyecto funcione offline y en horas.
- Vectores sparse por termino para que `data/index.json` sea legible y pedagogico.

## Como Ejecutar

```bash
npm install
npm run ingest
npm run search -- "graph neural networks for molecules"
```

Verificacion completa:

```bash
npm run verify
```

## Verificacion

- `npm run verify`: OK, genero indice de 6 papers con 168 terminos y encontro el paper de graph neural networks como primer resultado.

## Pendientes

- Agregar una UI web simple si el portfolio requiere demostracion visual.
- Agregar opcion de ingesta desde arXiv API publica si se desea trabajar online.

## Notas Para El Siguiente Agente

Mantener el proyecto pequeno. Si se agregan embeddings reales, conservar TF-IDF como fallback local sin costo y actualizar README/CONTEXT con el nuevo flujo.

## Historial De Cambios

- 2026-08-15: creado mini-proyecto con dataset local, ingesta TF-IDF y busqueda por coseno.

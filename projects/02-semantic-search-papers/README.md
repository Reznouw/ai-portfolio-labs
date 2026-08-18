# Semantic Search De Papers

Mini-proyecto de portfolio para aprender embeddings simples y busqueda semantica sobre metadatos de papers tipo arXiv.

Funciona sin APIs pagadas. Usa TF-IDF local y similitud coseno como embedding baseline para convertir titulo, resumen, autores y categorias en vectores buscables.

## Que Ensena

- Como convertir documentos en vectores numericos.
- Como guardar un indice local reproducible.
- Como transformar una consulta en el mismo espacio vectorial.
- Como ordenar resultados por similitud coseno.
- Por que TF-IDF es un baseline util antes de usar embeddings de LLMs.

## Requisitos

- Node.js 20 o superior.
- No requiere dependencias externas.

## Instalacion

```bash
npm install
```

## Ingestar Dataset

```bash
npm run ingest
```

Esto lee `data/sample-papers.json` y genera `data/index.json` con vocabulario, IDF y vectores normalizados.

## Buscar Papers

```bash
npm run search -- "retrieval augmented generation for scientific papers"
```

Opcionalmente limita resultados:

```bash
npm run search -- "privacy preserving machine learning" --top 3
```

## Verificacion Rapida

```bash
npm run verify
```

## Estructura

- `data/sample-papers.json`: dataset pequeno de papers ficticios estilo arXiv.
- `data/index.json`: indice generado por ingesta.
- `src/ingest.js`: construye el indice TF-IDF.
- `src/search.js`: ejecuta busquedas semanticas locales.
- `src/search-core.js`: tokenizacion, TF-IDF, normalizacion y coseno.

## Siguiente Paso Natural

Cambiar `embedDocument` por embeddings reales de un modelo local o API, manteniendo el mismo flujo: ingest -> index -> search.

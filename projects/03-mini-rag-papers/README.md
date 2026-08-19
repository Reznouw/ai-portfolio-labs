# Mini RAG Sobre Papers

Mini-proyecto 03 del portfolio: una demo ejecutable de RAG basico sobre 5 abstracts cortos de papers de IA. No usa PDFs grandes ni base vectorial externa; muestra el flujo minimo de recuperar contexto, ensamblarlo y generar una respuesta citada.

## Que Aprenderas

- Como separar datos, recuperacion, contexto y generacion.
- Como hacer retrieval simple con coincidencia de terminos y temas.
- Como construir contexto con citas `[1]`, `[2]`, `[3]`.
- Como usar un LLM compatible con OpenAI si hay API key.
- Como mantener un fallback local para que la demo funcione sin credenciales.

## Uso

Instalar no descarga dependencias, pero deja el flujo estandar de Node disponible:

```bash
npm install
```

Ejecutar con una pregunta por defecto:

```bash
npm start
```

Ejecutar con tu propia pregunta:

```bash
npm start -- "How does retrieval help reduce hallucinations?"
```

Verificacion rapida:

```bash
npm test
```

## LLM Opcional

La demo funciona sin API key. Si quieres usar un modelo real, configura variables compatibles con OpenAI:

```bash
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

En Windows PowerShell:

```powershell
$env:OPENAI_API_KEY="your_key"
npm start -- "What is Self-RAG?"
```

## Arquitectura

```txt
data/papers.json  # 5 abstracts markdown cortos
src/rag.js        # retrieval, contexto, fallback local y llamada LLM opcional
src/index.js      # CLI ejecutable
README.md         # guia del proyecto
CONTEXT.md        # contexto persistente del mini-proyecto
```

## Flujo RAG

1. Cargar `data/papers.json`.
2. Tokenizar la pregunta y cada abstract.
3. Puntuar papers por terminos compartidos y temas explicitos.
4. Tomar los 3 mejores resultados.
5. Ensamblar contexto con metadatos y citas.
6. Generar respuesta con LLM si hay API key.
7. Si no hay API key o falla la llamada, usar respuesta local extractiva.

## Limitaciones

- Retrieval de juguete: no usa embeddings ni reranking neural.
- Dataset pequeno y curado para explicar el patron.
- El fallback local no razona como un LLM; solo produce una sintesis simple desde los abstracts recuperados.

## Ideas Para Mejorar

- Agregar embeddings locales o una base vectorial pequena.
- Incluir evaluacion tipo faithfulness/context relevance.
- Exportar resultados a Markdown para publicar como post del portfolio.
- Agregar una UI local para explorar preguntas frecuentes.

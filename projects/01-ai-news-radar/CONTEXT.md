# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear una web local que reuna noticias recientes de IA desde fuentes publicas y produzca resumenes cortos. Debe servir como primer mini-proyecto del portfolio y como plantilla practica para proyectos pequenos.

## Arquitectura

- `src/fetch-news.js`: obtiene items de Hacker News, arXiv y TechCrunch RSS.
- `src/summarize.js`: usa LLM compatible con OpenAI si hay `OPENAI_API_KEY`; si no, usa resumen local extractivo.
- `src/server.js`: servidor HTTP minimo para servir la UI y `data/news.json`.
- `public/`: interfaz web responsive con tarjetas, filtros y metricas.
- `data/news.json`: archivo generado por `npm run fetch`.

## Decisiones Tomadas

- Node.js puro para reducir dependencias y facilitar ejecucion.
- LLM opcional para que el proyecto funcione aunque el usuario no tenga API key.
- UI sin framework para mantener el proyecto pequeno.
- Direccion visual frontend: radar editorial oscuro, tarjetas densas, alto contraste y foco en lectura rapida siguiendo criterio tipo Taste-Skill.

## Como Ejecutar

```bash
npm install
npm run fetch
npm run dev
```

Abrir `http://localhost:4173`.

## Verificacion

- `npm run fetch`: OK, genero 24 items en `data/news.json` sin API key usando fallback local.
- `node src/server.js` + request a `http://localhost:4173`: OK, HTTP 200.
- `npm run publish:next:dry-run` desde la raiz del portfolio: OK, detecta `01-ai-news-radar` como siguiente proyecto.
- Screenshot tomado desde `http://localhost:4173` y guardado en `assets/demo.png`.
- Pendiente verificar con API key real.

## Evidencia Visual

- `assets/demo.png`: captura de la web local desktop.

## Pendientes

- Agregar historico diario si el portfolio necesita evolucion del proyecto.

## Notas Para El Siguiente Agente

Antes de cambiar UI, mantener el proyecto pequeno. No meter React/Vite salvo que el alcance cambie. Si se agrega LLM de otro proveedor, hacerlo con variables de entorno y conservar fallback local.

## Historial De Cambios

- 2026-08-15: creado primer proyecto con ingesta, resumen opcional y UI local.

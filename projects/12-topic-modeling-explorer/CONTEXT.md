# Contexto Del Proyecto

## Estado Actual

- Estado: implementado en staging
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un explorador local de topic modeling sobre textos tipo BBC y 20 Newsgroups. Debe funcionar offline, sin dependencias externas, con TF-IDF simple, clusters deterministas y una interfaz pulida para entender temas, terminos y documentos asociados.

## Direccion Visual Frontend

- Direccion visual elegida: laboratorio editorial de NLP, fondo marfil oscuro/azulado, tarjetas limpias, acentos cian y lima, y visualizaciones compactas de terminos.
- Nivel de densidad visual: medio-alto, con resumen ejecutivo arriba, panel lateral de clusters y lectura detallada por documento.
- Componentes principales: hero con metricas, lista de topics, barras de terminos, buscador, filtro por cluster, tabla/tarjetas de documentos y panel explicativo del metodo.
- Decisiones de responsive: desktop en dos columnas con panel persistente; mobile en una columna con controles apilados y tarjetas de alto tactil.

## Arquitectura

- `src/build-topics.js`: carga documentos Markdown, tokeniza, calcula TF-IDF, ejecuta k-means determinista y escribe `public/data/topics.json`.
- `src/topic-engine.js`: motor NLP local compartido por build y verify.
- `src/server.js`: servidor HTTP minimo para servir la UI en `http://localhost:4173`.
- `src/verify.js`: verificacion offline de datos generados y endpoints basicos.
- `sample-docs/`: corpus pequeno estilo BBC/20-newsgroups-like.
- `public/`: frontend estatico sin framework.

## Decisiones Tomadas

- Sin dependencias ni llamadas externas para que el proyecto sea reproducible offline.
- TF-IDF con stopwords internas y bigramas seleccionados para mejorar etiquetas de topics sin modelos pesados.
- K-means determinista con semillas basadas en documentos espaciados para obtener resultados estables entre ejecuciones.
- El frontend consume JSON generado para mantener separada la preparacion NLP de la experiencia visual.

## Como Ejecutar

```bash
npm install
npm run build
npm run dev
```

Abrir `http://localhost:4173`.

## Verificacion

- Comando: `npm run verify`
- Estado: OK. Genero 5 topics desde 10 documentos y valido integridad de datos mas endpoints locales.

## Evidencia Visual

- `assets/demo.png`: captura tomada desde `http://localhost:4173`.

## Pendientes

- Si el corpus crece mucho, agregar paginacion o busqueda incremental.

## Notas Para El Siguiente Agente

Mantener ASCII y cero dependencias. Si se cambia el algoritmo, conservar salida estable en `public/data/topics.json` y actualizar la explicacion de metodologia en la UI.

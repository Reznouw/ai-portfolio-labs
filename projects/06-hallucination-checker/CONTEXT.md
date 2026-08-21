# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un verificador pequeno de alucinaciones para claims factuales. Ensena como comparar una afirmacion contra evidencia citada local y, si hay internet, sumar un resumen de Wikipedia como evidencia opcional.

## Arquitectura

- `src/checker.js`: carga corpus local, normaliza claims, aplica reglas lexicas y obtiene resumen opcional de Wikipedia REST.
- `src/cli.js`: CLI para claims individuales, demo de samples y modo `--check`.
- `data/evidence.json`: corpus local pequeno con snippets citables y reglas de soporte/refutacion.
- `samples/claims.json`: claims de ejemplo con verdict offline esperado.
- `package.json`: scripts sin dependencias externas.

## Decisiones Tomadas

- Node.js puro sin dependencias para funcionar sin API keys ni servicios pagos.
- Modo local determinista como fallback principal para que la verificacion sea reproducible.
- Wikipedia REST es opcional y nunca obligatorio para pasar tests.
- Si la evidencia no alcanza, el veredicto debe ser `uncertain` en vez de inventar soporte.

## Como Ejecutar

```bash
npm install
npm start -- --claim "The Eiffel Tower is in Paris" --no-wiki
npm run demo
npm test
```

## Verificacion

- `npm test`: OK, valida samples offline contra verdicts esperados.

## Pendientes

- Agregar mas corpus local si se quiere cubrir mas dominios.
- Agregar un modelo local opcional de entailment si el entorno lo permite.

## Notas Para El Siguiente Agente

Mantener el proyecto pequeno, ASCII-only y local-first. No agregar proveedores pagos ni claves. Cualquier integracion externa debe ser opcional y tener fallback offline.

## Historial De Cambios

- 2026-08-15: creado Hallucination Checker con CLI, corpus local, samples, Wikipedia opcional y verificacion offline.

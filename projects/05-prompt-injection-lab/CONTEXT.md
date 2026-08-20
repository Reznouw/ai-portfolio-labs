# Contexto Del Proyecto

## Estado Actual

- Estado: listo para publicar
- Ultima actualizacion: 2026-08-15
- Responsable/agente actual: OpenCode

## Objetivo

Crear un laboratorio local y seguro que explique ataques de prompt injection y defensas basicas con prompts de juguete, sin secretos reales ni llamadas a APIs externas.

## Arquitectura

- `src/simulator.js`: motor rule-based que detecta patrones de inyeccion, aplica defensas simuladas y genera explicaciones.
- `src/cli.js`: demo por terminal, ejecucion de prompts personalizados y verificacion con `--check`.
- `src/server.js`: servidor HTTP minimo para la UI y endpoints JSON.
- `public/`: pagina web simple para probar ejemplos y prompts propios.
- `samples/attacks.json`: ataques de muestra seguros y educativos.

## Decisiones Tomadas

- Node.js puro sin dependencias para que el proyecto sea facil de ejecutar.
- Simulador rule-based en vez de LLM real para evitar costos, secretos y comportamiento no determinista.
- Secretos falsos y prompts de juguete para demostrar el concepto sin riesgo operativo.
- CLI y web local para cubrir uso rapido y demo visual.

## Como Ejecutar

```bash
npm install
npm run demo
npm run dev
npm test
```

Abrir `http://localhost:4175` despues de `npm run dev`.

## Verificacion

- `npm test`: OK, ejecuta los samples y valida que haya detecciones y defensas activas.
- Screenshot tomado desde `http://localhost:4175` y guardado en `assets/demo.png`.

## Evidencia Visual

- `assets/demo.png`: captura de la web local desktop.

## Pendientes

- Ampliar ataques de ejemplo con mas categorias educativas.

## Notas Para El Siguiente Agente

Mantener el proyecto offline y determinista. No agregar claves reales ni integraciones con proveedores LLM salvo que exista un modo seguro con variables de entorno y ejemplos redaccionados.

## Historial De Cambios

- 2026-08-15: creado Prompt Injection Lab con CLI, web local, simulador y samples.

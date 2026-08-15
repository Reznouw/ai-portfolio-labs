# Protocolo De Contexto Persistente

Cada mini-proyecto debe incluir un archivo obligatorio llamado `CONTEXT.md` en su raiz.

## Regla Principal

Antes de trabajar en un proyecto, leer `CONTEXT.md`. Al terminar, actualizarlo si hubo cambios relevantes.

Esto evita que el trabajo de ayer, las decisiones de otro agente o los problemas pendientes se pierdan.

## Plantilla Obligatoria

```md
# Contexto Del Proyecto

## Estado Actual

- Estado: idea | en progreso | verificando | listo para publicar | publicado
- Ultima actualizacion: YYYY-MM-DD
- Responsable/agente actual: nombre o rol

## Objetivo

Describe que ensena este mini-proyecto y que entrega.

## Arquitectura

Explica carpetas, componentes principales, scripts y flujo de datos.

## Decisiones Tomadas

- Decision: motivo.

## Como Ejecutar

Comandos principales para instalar, correr y probar.

## Verificacion

Que se probo y que falta probar.

## Pendientes

- Lista concreta de tareas pendientes.

## Notas Para El Siguiente Agente

Contexto operativo para continuar sin repetir investigacion.

## Historial De Cambios

- YYYY-MM-DD: cambio realizado.
```

## Reglas Para Agentes

- No empezar a modificar un proyecto sin leer `CONTEXT.md`.
- No borrar decisiones previas; agregar correcciones debajo si una decision cambio.
- Registrar errores conocidos aunque no se arreglen todavia.
- Mantener el contexto corto, util y accionable.
- Si un proyecto queda listo para publicar, cambiar `Estado` a `listo para publicar`.

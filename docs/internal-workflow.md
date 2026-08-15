# Workflow Interno

Este documento es para operacion local del portfolio. No es parte de la presentacion publica del repositorio.

## Objetivo Interno

Cada proyecto debe ser pequeno, ejecutable en pocas horas y suficientemente explicado para que otra persona pueda entenderlo, correrlo y modificarlo.

## Estructura Interna

```txt
ai-portfolio-labs/
  staging/      # Proyectos listos, aun no publicados
  projects/     # Proyectos ya publicados
  shared/       # Utilidades reutilizables
  scripts/      # Automatizacion local
  docs/         # Guias y protocolo de trabajo
```

## Publicacion Manual

Publicar el siguiente proyecto disponible:

```bash
npm run publish:next
```

Probar sin cambiar archivos:

```bash
npm run publish:next:dry-run
```

Publicar y crear commit sin hacer push:

```bash
npm run publish:next:no-push
```

## Publicacion Automatica Diaria

En Windows, ejecutar una vez:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-daily-publish-task.ps1
```

Esto crea una tarea llamada `AI Portfolio Daily Publish` que ejecuta `npm run publish:next` todos los dias a las 12:00.

Requisitos:

- Node.js 20 o superior.
- Git configurado.
- Remote de GitHub configurado.
- Autenticacion de GitHub funcionando para `git push`.
- La computadora encendida al mediodia.

## Regla Obligatoria De Contexto

Todo proyecto debe tener un archivo `CONTEXT.md`. Antes de editar un proyecto, cualquier agente debe leerlo. Despues de trabajar, debe actualizarlo si cambio arquitectura, estado, decisiones, pendientes o errores conocidos.

Ver `docs/context-protocol.md`.

## Regla Frontend

Si un proyecto necesita interfaz, dashboard o demo visual, se debe usar Taste-Skill como referencia de calidad frontend para evitar UI generica.

Ver `docs/frontend-quality.md`.

## Flujo De Trabajo

1. Construir proyectos dentro de `staging/`.
2. Verificar que cada proyecto tenga `README.md` y `CONTEXT.md`.
3. Ejecutar `npm run publish:next:dry-run`.
4. Usar publicacion automatica diaria o `npm run publish:next` como respaldo manual.

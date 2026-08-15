# Regla De Calidad Frontend

Cuando un mini-proyecto tenga interfaz web, dashboard, landing, demo visual o componente UI, se debe aplicar Taste-Skill como referencia de criterio visual.

Repositorio recomendado:

```txt
https://github.com/Leonxlnx/taste-skill
```

Skill principal recomendada:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

## Criterios Minimos

- Evitar layouts genericos tipo dashboard sin jerarquia visual.
- Definir una direccion visual por proyecto antes de implementar UI.
- Cuidar tipografia, espaciado, densidad, estados hover/focus y responsive.
- Si hay motion, debe ser util y ligera, no decoracion excesiva.
- Mantener accesibilidad basica: contraste, labels, foco visible y navegacion por teclado.

## Regla Operativa

Antes de hacer frontend, registrar en `CONTEXT.md`:

- Direccion visual elegida.
- Nivel de densidad visual.
- Componentes principales.
- Decisiones de responsive.

Despues de implementar, actualizar `CONTEXT.md` con lo que quedo hecho y lo que falta pulir.

## Screenshots Obligatorios

Si el proyecto tiene pagina o demo frontend, debe guardar al menos una captura en:

```txt
assets/demo.png
```

El `README.md` debe mostrarla cerca de la seccion Demo:

```md
![Demo](assets/demo.png)
```

Comando recomendado desde la raiz del portfolio:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/capture-screenshot.ps1 -Url "http://localhost:4173" -Output "staging/01-ai-news-radar/assets/demo.png"
```

Tambien registrar en `CONTEXT.md` que la captura fue tomada y desde que URL.

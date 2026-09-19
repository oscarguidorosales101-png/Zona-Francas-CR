# ZoFranca CR — Laboratorio #3

Proyecto académico listo para abrir en Visual Studio Code.

## Requisitos
- Node.js 18 o superior
- npm

## Instalación
```bash
npm install
```

## Ejecución
```bash
npm run dev
```

Esto inicia:
- Vite: http://localhost:5173
- json-server: http://localhost:3001

## Qué demuestra
- `fetch()` contra json-server.
- `Promise`, `async/await`, `Promise.all`, `try/catch/finally`.
- Estados Cargando / Listo / Error.
- Registro de solicitudes.
- IA simulada con puntaje 0–100, justificación y clasificación.
- Decisión final humana.
- Empresas instaladas y reportes de cumplimiento.
- Comparación de compromisos y alertas.
- Historial básico y métricas.

## Interfaz y Fondo Animado
- **Imagen utilizada**: Imagen tecnológica con vectores diagonales ascendentes (`image.png`).
- **Ubicación de la imagen**: `img/image.png`.
- **Comportamiento de la animación**:
  - Desplazamiento continuo, lento y elegante en bucle infinito (duración de 26 segundos).
  - Dirección visual: de abajo/izquierda hacia arriba/derecha, siguiendo la orientación natural de la imagen.
  - Proporciones preservadas mediante `background-size: cover` con capa de contraste y gradientes para máxima legibilidad.
  - Totalmente responsivo para escritorio, laptop, tablet y móvil sin generar scroll horizontal.
  - Compatible con accesibilidad mediante `prefers-reduced-motion`.

## Nota académica
Los criterios de admisión en `db.json` son datos de demostración del laboratorio y no representan normativa oficial de Costa Rica.

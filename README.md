# HSE Operations Board

Tablero web para seguimiento mensual de controles operacionales SSTyMA y PBIP. Incluye asignación de tareas, cumplimiento por responsable, trazabilidad mensual y gráfico anual.

## Funcionalidades

- Tablero principal de cumplimiento del equipo.
- Gestión de tareas con filtros por responsable, estatus y semana/frecuencia mensual.
- Comentarios y cierre por tarea.
- Cumplimiento individual por responsable.
- Trazabilidad automática al cambiar de mes.
- Gráfico anual de cumplimiento mes a mes.
- Diseño responsive para navegador de escritorio y teléfonos móviles.

## Persistencia de datos

La aplicación guarda información en `localStorage` del navegador. Esto permite conservar datos en el mismo dispositivo y navegador, pero no sincroniza datos entre varios usuarios.

Para que todo el equipo vea y edite la misma información en línea, el siguiente paso sería integrar una base de datos como Supabase, Firebase o una API propia.

## Ejecutar localmente

Requiere Node.js.

```bash
npm start
```

Luego abre:

```text
http://127.0.0.1:4173
```

## Publicar en GitHub

1. Crea un repositorio nuevo en GitHub.
2. Desde esta carpeta, inicializa Git y sube el proyecto:

```bash
git init
git add .
git commit -m "Initial HSE Operations Board"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/hse-operations-board.git
git push -u origin main
```

## Publicar en Vercel

1. Entra a [Vercel](https://vercel.com).
2. Selecciona `Add New...` y luego `Project`.
3. Importa el repositorio de GitHub.
4. Framework Preset: `Other`.
5. Build Command: dejar vacío.
6. Output Directory: dejar vacío.
7. Deploy.

Vercel publicará los archivos estáticos `index.html`, `styles.css` y `app.js`.

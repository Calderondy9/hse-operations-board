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

La aplicación puede trabajar en dos modos:

- **Modo compartido con Supabase:** todos los usuarios leen y guardan el mismo estado de tareas en línea.
- **Modo respaldo local:** si Supabase no está configurado o falla la conexión, la app conserva datos en `localStorage` del navegador.

## Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En Supabase, abre `SQL Editor`.
3. Copia y ejecuta el contenido de `supabase-schema.sql`.
4. En el proyecto, entra a `Connect` o `Project Settings > API Keys`.
5. Copia:
   - Project URL
   - Publishable key
6. En `supabase-config.js`, coloca esos valores:

```js
window.HSE_SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  publishableKey: "TU-PUBLISHABLE-KEY"
};
```

7. Guarda, haz commit y push. Vercel publicará la app conectada a Supabase.

Nota: el archivo `supabase-schema.sql` habilita lectura y escritura con la llave pública para que el equipo pueda colaborar sin login. Para control por usuario, el siguiente paso sería agregar autenticación y políticas RLS por responsable.

## Protección de datos en Supabase

La app guarda el estado compartido en la fila `production` de `hse_app_state`. Antes de sobrescribir esa fila, la versión actual crea una fila de respaldo con prefijo `backup-`, valida si otra persona guardó cambios más recientes y fusiona la tarea modificada para reducir el riesgo de pisar avances del equipo.

Después de publicar esta versión, vuelve a ejecutar `supabase-schema.sql` en el SQL Editor de Supabase. Esa actualización bloquea escrituras sobre `production` desde versiones antiguas de la app que no incluyan la versión mínima vigente de `appBuildVersion`, pero mantiene permitidos los respaldos `backup-*`.

Si el navegador detecta que existe una versión más nueva de `app.js`, la app se recarga automáticamente cuando no hay texto ni formularios en edición. Si el usuario está escribiendo, muestra el aviso de "Versión antigua detectada", conserva temporalmente los borradores y los restaura después de actualizar.

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

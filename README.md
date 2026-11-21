# CritiCut 🎬

Aplicación móvil de reseñas de **películas y series**, construida con **Ionic 9 + Angular 22 + Capacitor 8**. La crítica se mide con un cuchillo afilado o mellado, y la audiencia con palomitas.

## Nube y cuentas

La app ya no guarda los datos solo en el teléfono. Ahora usa una API propia desplegada en **Cloudflare Workers** con base de datos **D1**:

- **API:** https://criticut-api.criticut-eldirangel.workers.dev
- **Código del servidor:** `server/`
- **Base de datos:** Cloudflare D1 (`criticut-db`, región ENAM)

Cada cuenta:

- Nace con su **catálogo de películas vacío** (no se copian datos de ejemplo).
- Conserva su catálogo al cerrar sesión, reiniciar la app o cambiar de dispositivo.
- Puede agregar títulos desde TMDB a su propio catálogo.
- Puede escribir **una reseña por título** (1 a 10) y editarla o eliminarla.
- **Ve las reseñas de todos los demás usuarios** sobre los títulos que tenga en su catálogo. Los títulos son globales para que las reseñas se compartan; la biblioteca es privada de cada cuenta.

## Funcionalidades

- **CRUD de usuarios**: registro, inicio de sesión, edición de perfil y eliminación de cuenta.
- **CRUD de reseñas**: cada usuario puede escribir, editar y borrar una reseña por título, con opinión de 5 a 100 caracteres y puntaje de 1 a 10.
- **Validaciones**: nombre de usuario de 2 a 16 caracteres sin espacios; contraseña de 6 a 16 caracteres sin espacios.
- **Diferencia entre usuarios y críticos**: al registrarse se elige el rol; el detalle muestra el Criticómetro (cuchillo) y el promedio de la audiencia (palomitas) por separado.
- **Filtros**: búsqueda por nombre, categoría, año y puntaje mínimo.
- **Ordenamiento**: por puntaje o por fecha, en ambos sentidos.
- **API externa (TMDB)**: búsqueda de películas/series reales e importación al catálogo en la nube (sin duplicados).
- **Ficha completa**: sinopsis, fecha de estreno, duración, géneros, reparto, carátula y puntajes.
- **Reseñas de la comunidad**: visibles para todas las cuentas que tengan el título en su catálogo.

## Requisitos

- Node.js 24.15+ (Angular 22) y npm.
- Una **API key gratuita de TMDB**: https://www.themoviedb.org/settings/api

## Configurar la API key

Edita `src/environments/environment.ts` (y `environment.prod.ts` para producción):

```ts
export const environment = {
  production: false,
  tmdbApiKey: 'TU_API_KEY_AQUI',
  tmdbLanguage: 'es-ES',
  apiBaseUrl: 'https://criticut-api.criticut-eldirangel.workers.dev'
};
```

Sin la clave de TMDB, la app funciona con las cuentas y reseñas de la nube, pero la pestaña **Buscar** mostrará un aviso.

## Ejecutar en el navegador

```cmd
npm install
npm start
```

Abre `http://localhost:4200`.

Para probar desde el celular en la misma red:

```cmd
npm run start:mobile
```

## Crear una cuenta

Regístrate desde la pantalla de inicio eligiendo el rol de **usuario** o **crítico**. El nombre y la contraseña no admiten espacios, y el nombre tiene un máximo de 16 caracteres. La cuenta se crea en la nube con el catálogo vacío. No hay cuentas de prueba visibles en el login.

## Servidor en la nube

La API está en `server/` y se despliega con Wrangler:

```cmd
cd server
npm install
npx wrangler login
npm run db:migrate:remote
npm run deploy
```

La configuración de D1 está en `server/wrangler.toml`. El secreto `JWT_SECRET` se guarda con `npx wrangler secret put JWT_SECRET`.

### Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Crea la cuenta (catálogo vacío) y devuelve un token. |
| POST | `/api/auth/login` | Inicia sesión y devuelve un token. |
| GET | `/api/auth/me` | Devuelve el usuario de la sesión. |
| PATCH | `/api/auth/profile` | Actualiza nombre, correo o avatar. |
| DELETE | `/api/auth/account` | Elimina la cuenta, su catálogo y sus reseñas. |
| GET | `/api/library` | Catálogo del usuario + reseñas compartidas de esos títulos. |
| POST | `/api/library` | Agrega un título al catálogo del usuario. |
| GET | `/api/media/:id` | Ficha del título con las reseñas de todos los usuarios. |
| POST | `/api/media/:id/reviews` | Crea la reseña del usuario. |
| PATCH | `/api/reviews/:id` | Edita una reseña propia. |
| DELETE | `/api/reviews/:id` | Elimina una reseña propia. |
| GET | `/api/reviews/mine` | Reseñas propias y títulos asociados. |

## Compilar para producción

```cmd
npm run build
```

Genera la carpeta `www/`.

## Android / APK

El proyecto Android se genera con Capacitor:

```cmd
npm run build
npx cap add android
npx cap sync android
npm run apk
```

El APK de depuración queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Estructura

```
criticut/
├── server/       API de Cloudflare Workers + migraciones D1
├── android/      Proyecto Android generado por Capacitor
└── src/app/
    ├── core/     modelos, servicios de API, guards y constantes
    ├── features/ pantallas (auth, media, reviews, tabs)
    └── shared/   componentes y pipes reutilizables
```

## Notas

- Las contraseñas se guardan **hasheadas con PBKDF2-SHA256** y sal aleatoria; nunca en texto plano.
- La sesión usa un **JWT firmado** con expiración de 30 días, guardado localmente en Ionic Storage.
- Las reseñas son globales por título; cada cuenta mantiene su propia biblioteca privada.
- La API key de TMDB queda visible en el cliente, algo normal en apps front-end.

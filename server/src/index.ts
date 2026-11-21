/**
 * CritiCut API — Cloudflare Worker + D1
 *
 * Modelo:
 *  - `users`: cuentas.
 *  - `media`: catálogo global de títulos (se comparte para que las reseñas
 *    apunten al mismo título entre distintas cuentas).
 *  - `libraries`: qué títulos agregó cada usuario. Al registrarse NO se
 *    inserta ninguna fila, por lo que cada cuenta nueva empieza vacía.
 *  - `reviews`: reseñas globales de todos los usuarios sobre cada título.
 */

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

type UserRole = 'user' | 'critic';
type MediaType = 'movie' | 'tv';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaRow {
  id: string;
  tmdb_id: number;
  type: MediaType;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: string;
  actors: string;
  runtime: number | null;
  tmdb_rating: number;
  created_at: string;
}

interface ReviewRow {
  id: string;
  media_id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NO_SPACES_REGEX = /^\S+$/;
const PBKDF2_ITERATIONS = 100_000;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function empty(status = 204): Response {
  return new Response(null, { status, headers: CORS_HEADERS });
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError('El cuerpo de la petición no es válido.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('El cuerpo de la petición no es válido.');
  }
  return body as Record<string, unknown>;
}

function requiredText(
  value: unknown,
  field: string,
  min: number,
  max: number
): string {
  if (typeof value !== 'string') {
    throw new ApiError(`El campo ${field} es obligatorio.`);
  }
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new ApiError(`El campo ${field} debe tener entre ${min} y ${max} caracteres.`);
  }
  return text;
}

function requiredRawText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string') {
    throw new ApiError(`El campo ${field} es obligatorio.`);
  }
  if (value.length < min || value.length > max) {
    throw new ApiError(`El campo ${field} debe tener entre ${min} y ${max} caracteres.`);
  }
  return value;
}

function optionalText(value: unknown, max: number): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value !== 'string') {
    throw new ApiError('Se recibió un texto no válido.');
  }
  const text = value.trim();
  if (text.length > max) {
    throw new ApiError(`El texto supera el máximo de ${max} caracteres.`);
  }
  return text;
}

function nullableText(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ApiError('Se recibió un texto no válido.');
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  if (text.length > max) {
    throw new ApiError(`El texto supera el máximo de ${max} caracteres.`);
  }
  return text;
}

function stringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ApiError('Se recibió una lista no válida.');
  }
  const items: string[] = [];
  for (const raw of value.slice(0, maxItems)) {
    if (typeof raw !== 'string') {
      continue;
    }
    const item = raw.trim().slice(0, maxLength);
    if (item) {
      items.push(item);
    }
  }
  return items;
}

function parseEmail(value: unknown): string {
  const email = requiredText(value, 'correo', 3, 100).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError('El correo no tiene un formato válido.');
  }
  return email;
}

function parseName(value: unknown): string {
  const name = requiredText(value, 'nombre', 2, 16);
  if (!NO_SPACES_REGEX.test(name)) {
    throw new ApiError('El nombre de usuario no puede contener espacios.');
  }
  return name;
}

function parsePassword(value: unknown): string {
  const password = requiredRawText(value, 'contraseña', 6, 16);
  if (!NO_SPACES_REGEX.test(password)) {
    throw new ApiError('La contraseña no puede contener espacios.');
  }
  return password;
}

function parseRole(value: unknown): UserRole {
  if (value === 'user' || value === 'critic') {
    return value;
  }
  throw new ApiError('El rol debe ser "user" o "critic".');
}

function parseRating(value: unknown): number {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    throw new ApiError('La calificación debe ser un número entero entre 1 y 10.');
  }
  return rating;
}

function parseComment(value: unknown): string {
  return requiredText(value, 'comentario', 5, 100);
}

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

async function derivePassword(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterationsRaw, saltRaw, hashRaw] = stored.split('$');
  if (scheme !== 'pbkdf2' || !saltRaw || !hashRaw) {
    return false;
  }
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > PBKDF2_ITERATIONS) {
    return false;
  }
  const expected = base64UrlToBytes(hashRaw);
  const actual = await derivePassword(password, base64UrlToBytes(saltRaw), iterations);
  if (actual.length !== expected.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < actual.length; index++) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

async function signToken(userId: string, secret: string): Promise<string> {
  const header = textToBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = textToBase64Url(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
    })
  );
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [header, payload, signature] = parts;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(`${header}.${payload}`)
    );
  } catch {
    return null;
  }
  if (!valid) {
    return null;
  }
  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (
      typeof data.sub !== 'string' ||
      typeof data.exp !== 'number' ||
      data.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return data.sub;
  } catch {
    return null;
  }
}

async function requireUser(request: Request, env: Env): Promise<UserRow> {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    throw new ApiError('No autorizado.', 401);
  }
  const userId = await verifyToken(token, env.JWT_SECRET);
  if (!userId) {
    throw new ApiError('Sesión inválida o expirada.', 401);
  }
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<UserRow>();
  if (!user) {
    throw new ApiError('La cuenta no existe.', 401);
  }
  return user;
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? undefined,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function mediaFromRow(row: MediaRow) {
  return {
    id: row.id,
    tmdbId: row.tmdb_id,
    type: row.type,
    title: row.title,
    overview: row.overview,
    releaseDate: row.release_date,
    posterPath: row.poster_path,
    backdropPath: row.backdrop_path,
    genres: parseJsonArray(row.genres),
    actors: parseJsonArray(row.actors),
    runtime: row.runtime ?? null,
    tmdbRating: row.tmdb_rating,
    createdAt: row.created_at
  };
}

function reviewFromRow(row: ReviewRow) {
  return {
    id: row.id,
    mediaId: row.media_id,
    userId: row.user_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

interface ParsedMedia {
  tmdbId: number;
  type: MediaType;
  title: string;
  overview: string;
  releaseDate: string;
  posterPath: string | null;
  backdropPath: string | null;
  genres: string[];
  actors: string[];
  runtime: number | null;
  tmdbRating: number;
}

function parseMediaPayload(body: Record<string, unknown>): ParsedMedia {
  const tmdbId = Number(body['tmdbId']);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    throw new ApiError('El identificador de TMDB no es válido.');
  }
  const type = body['type'];
  if (type !== 'movie' && type !== 'tv') {
    throw new ApiError('El tipo debe ser "movie" o "tv".');
  }
  const title = requiredText(body['title'], 'título', 1, 300);
  const overview = optionalText(body['overview'], 8_000);
  const releaseDate = optionalText(body['releaseDate'], 10);
  const posterPath = nullableText(body['posterPath'], 300);
  const backdropPath = nullableText(body['backdropPath'], 300);
  const genres = stringArray(body['genres'], 25, 80);
  const actors = stringArray(body['actors'], 40, 120);
  const runtimeRaw = body['runtime'];
  const runtime =
    runtimeRaw === null || runtimeRaw === undefined || runtimeRaw === ''
      ? null
      : Math.max(0, Math.floor(Number(runtimeRaw))) || null;
  const ratingRaw = Number(body['tmdbRating']);
  const tmdbRating = Number.isFinite(ratingRaw) ? Math.min(10, Math.max(0, ratingRaw)) : 0;

  return {
    tmdbId,
    type,
    title,
    overview,
    releaseDate,
    posterPath,
    backdropPath,
    genres,
    actors,
    runtime,
    tmdbRating
  };
}

async function findMediaByTmdb(
  env: Env,
  tmdbId: number,
  type: MediaType
): Promise<MediaRow | null> {
  return env.DB.prepare('SELECT * FROM media WHERE tmdb_id = ? AND type = ?')
    .bind(tmdbId, type)
    .first<MediaRow>();
}

async function findMediaById(env: Env, id: string): Promise<MediaRow | null> {
  return env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(id).first<MediaRow>();
}

async function findReviewById(env: Env, id: string): Promise<ReviewRow | null> {
  return env.DB.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first<ReviewRow>();
}

async function isInLibrary(env: Env, userId: string, mediaId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    'SELECT 1 AS present FROM libraries WHERE user_id = ? AND media_id = ?'
  )
    .bind(userId, mediaId)
    .first<{ present: number }>();
  return Boolean(row);
}

async function listReviewsForMedia(env: Env, mediaId: string): Promise<ReviewRow[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM reviews WHERE media_id = ? ORDER BY created_at DESC'
  )
    .bind(mediaId)
    .all<ReviewRow>();
  return result.results ?? [];
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return empty();
  }

  if (path === '/' || path === '/api/health') {
    if (method !== 'GET') {
      throw new ApiError('Método no permitido.', 405);
    }
    return json({ ok: true, service: 'criticut-api' });
  }

  if (path === '/api/auth/register') {
    if (method !== 'POST') {
      throw new ApiError('Método no permitido.', 405);
    }
    const body = await readJson(request);
    const name = parseName(body['name']);
    const email = parseEmail(body['email']);
    const password = parsePassword(body['password']);
    const role = parseRole(body['role']);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: string }>();
    if (existing) {
      throw new ApiError('Ya existe una cuenta con ese correo.', 409);
    }

    const now = new Date().toISOString();
    const user: UserRow = {
      id: generateId('user'),
      name,
      email,
      password_hash: await hashPassword(password),
      role,
      avatar: null,
      created_at: now,
      updated_at: now
    };

    await env.DB.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        user.id,
        user.name,
        user.email,
        user.password_hash,
        user.role,
        user.avatar,
        user.created_at,
        user.updated_at
      )
      .run();

    // Importante: no se agrega nada a `libraries`. El catálogo nace vacío.
    return json(
      { token: await signToken(user.id, env.JWT_SECRET), user: publicUser(user) },
      201
    );
  }

  if (path === '/api/auth/login') {
    if (method !== 'POST') {
      throw new ApiError('Método no permitido.', 405);
    }
    const body = await readJson(request);
    const email = parseEmail(body['email']);
    const password = requiredRawText(body['password'], 'contraseña', 1, 100);

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<UserRow>();
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError('Correo o contraseña incorrectos.', 401);
    }

    return json({ token: await signToken(user.id, env.JWT_SECRET), user: publicUser(user) });
  }

  // A partir de aquí todas las rutas exigen sesión.
  const user = await requireUser(request, env);

  if (path === '/api/auth/me') {
    if (method !== 'GET') {
      throw new ApiError('Método no permitido.', 405);
    }
    return json({ user: publicUser(user) });
  }

  if (path === '/api/auth/profile') {
    if (method !== 'PATCH') {
      throw new ApiError('Método no permitido.', 405);
    }
    const body = await readJson(request);
    let name = user.name;
    let email = user.email;
    let avatar = user.avatar;

    if ('name' in body) {
      name = parseName(body['name']);
    }
    if ('email' in body) {
      email = parseEmail(body['email']);
    }
    if ('avatar' in body) {
      avatar = nullableText(body['avatar'], 500);
    }

    if (email !== user.email) {
      const owner = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: string }>();
      if (owner && owner.id !== user.id) {
        throw new ApiError('Ese correo ya está en uso.', 409);
      }
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      'UPDATE users SET name = ?, email = ?, avatar = ?, updated_at = ? WHERE id = ?'
    )
      .bind(name, email, avatar, now, user.id)
      .run();

    if (name !== user.name) {
      // Las reseñas compartidas muestran el nombre actualizado del autor.
      await env.DB.prepare('UPDATE reviews SET author_name = ? WHERE user_id = ?')
        .bind(name, user.id)
        .run();
    }

    const updated = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(user.id)
      .first<UserRow>();
    return json({ user: publicUser(updated ?? { ...user, name, email, avatar, updated_at: now }) });
  }

  if (path === '/api/auth/account') {
    if (method !== 'DELETE') {
      throw new ApiError('Método no permitido.', 405);
    }
    await env.DB.batch([
      env.DB.prepare('DELETE FROM reviews WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM libraries WHERE user_id = ?').bind(user.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id)
    ]);
    return json({ ok: true });
  }

  if (path === '/api/library') {
    if (method === 'GET') {
      const mediaResult = await env.DB.prepare(
        `SELECT m.*
         FROM media m
         INNER JOIN libraries l ON l.media_id = m.id
         WHERE l.user_id = ?
         ORDER BY l.added_at DESC`
      )
        .bind(user.id)
        .all<MediaRow>();
      const reviewResult = await env.DB.prepare(
        `SELECT r.*
         FROM reviews r
         INNER JOIN libraries l ON l.media_id = r.media_id AND l.user_id = ?
         ORDER BY r.created_at DESC`
      )
        .bind(user.id)
        .all<ReviewRow>();

      return json({
        media: (mediaResult.results ?? []).map(mediaFromRow),
        reviews: (reviewResult.results ?? []).map(reviewFromRow)
      });
    }

    if (method === 'POST') {
      const data = parseMediaPayload(await readJson(request));
      let media = await findMediaByTmdb(env, data.tmdbId, data.type);

      if (!media) {
        const now = new Date().toISOString();
        try {
          await env.DB.prepare(
            `INSERT INTO media
              (id, tmdb_id, type, title, overview, release_date, poster_path,
               backdrop_path, genres, actors, runtime, tmdb_rating, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              generateId('media'),
              data.tmdbId,
              data.type,
              data.title,
              data.overview,
              data.releaseDate,
              data.posterPath,
              data.backdropPath,
              JSON.stringify(data.genres),
              JSON.stringify(data.actors),
              data.runtime,
              data.tmdbRating,
              now
            )
            .run();
        } catch {
          // Otra petición pudo insertar el mismo título al mismo tiempo.
        }
        media = await findMediaByTmdb(env, data.tmdbId, data.type);
      }

      if (!media) {
        throw new ApiError('No se pudo guardar el título.', 500);
      }

      await env.DB.prepare(
        'INSERT OR IGNORE INTO libraries (user_id, media_id, added_at) VALUES (?, ?, ?)'
      )
        .bind(user.id, media.id, new Date().toISOString())
        .run();

      return json({ media: mediaFromRow(media) }, 201);
    }

    throw new ApiError('Método no permitido.', 405);
  }

  const libraryItemMatch = path.match(/^\/api\/library\/([^/]+)$/);
  if (libraryItemMatch) {
    if (method !== 'DELETE') {
      throw new ApiError('Método no permitido.', 405);
    }
    const mediaId = decodeURIComponent(libraryItemMatch[1]);
    await env.DB.prepare('DELETE FROM libraries WHERE user_id = ? AND media_id = ?')
      .bind(user.id, mediaId)
      .run();
    return json({ ok: true });
  }

  if (path === '/api/reviews/mine') {
    if (method !== 'GET') {
      throw new ApiError('Método no permitido.', 405);
    }
    const reviewResult = await env.DB.prepare(
      'SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(user.id)
      .all<ReviewRow>();
    const mediaResult = await env.DB.prepare(
      `SELECT DISTINCT m.*
       FROM media m
       INNER JOIN reviews r ON r.media_id = m.id
       WHERE r.user_id = ?`
    )
      .bind(user.id)
      .all<MediaRow>();
    return json({
      reviews: (reviewResult.results ?? []).map(reviewFromRow),
      media: (mediaResult.results ?? []).map(mediaFromRow)
    });
  }

  const mediaMatch = path.match(/^\/api\/media\/([^/]+)$/);
  if (mediaMatch) {
    if (method !== 'GET') {
      throw new ApiError('Método no permitido.', 405);
    }
    const mediaId = decodeURIComponent(mediaMatch[1]);
    const media = await findMediaById(env, mediaId);
    if (!media || !(await isInLibrary(env, user.id, mediaId))) {
      throw new ApiError('Título no encontrado en tu catálogo.', 404);
    }
    return json({
      media: mediaFromRow(media),
      reviews: (await listReviewsForMedia(env, mediaId)).map(reviewFromRow)
    });
  }

  const mediaReviewsMatch = path.match(/^\/api\/media\/([^/]+)\/reviews$/);
  if (mediaReviewsMatch) {
    if (method !== 'POST') {
      throw new ApiError('Método no permitido.', 405);
    }
    const mediaId = decodeURIComponent(mediaReviewsMatch[1]);
    const media = await findMediaById(env, mediaId);
    if (!media) {
      throw new ApiError('Título no encontrado.', 404);
    }
    if (!(await isInLibrary(env, user.id, mediaId))) {
      throw new ApiError('Agrega el título a tu catálogo antes de reseñarlo.', 403);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM reviews WHERE media_id = ? AND user_id = ?'
    )
      .bind(mediaId, user.id)
      .first<{ id: string }>();
    if (existing) {
      throw new ApiError('Ya escribiste una reseña para este título.', 409);
    }

    const body = await readJson(request);
    const rating = parseRating(body['rating']);
    const comment = parseComment(body['comment']);
    const now = new Date().toISOString();
    const review: ReviewRow = {
      id: generateId('review'),
      media_id: mediaId,
      user_id: user.id,
      author_name: user.name,
      author_role: user.role,
      rating,
      comment,
      created_at: now,
      updated_at: now
    };

    await env.DB.prepare(
      `INSERT INTO reviews
        (id, media_id, user_id, author_name, author_role, rating, comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        review.id,
        review.media_id,
        review.user_id,
        review.author_name,
        review.author_role,
        review.rating,
        review.comment,
        review.created_at,
        review.updated_at
      )
      .run();

    return json({ review: reviewFromRow(review) }, 201);
  }

  const reviewMatch = path.match(/^\/api\/reviews\/([^/]+)$/);
  if (reviewMatch) {
    const reviewId = decodeURIComponent(reviewMatch[1]);
    const review = await findReviewById(env, reviewId);
    if (!review) {
      throw new ApiError('Reseña no encontrada.', 404);
    }

    if (method === 'GET') {
      return json({ review: reviewFromRow(review) });
    }

    if (review.user_id !== user.id) {
      throw new ApiError('No puedes modificar la reseña de otra persona.', 403);
    }

    if (method === 'PATCH') {
      const body = await readJson(request);
      const rating = 'rating' in body ? parseRating(body['rating']) : review.rating;
      const comment = 'comment' in body ? parseComment(body['comment']) : review.comment;
      const updatedAt = new Date().toISOString();

      await env.DB.prepare('UPDATE reviews SET rating = ?, comment = ?, updated_at = ? WHERE id = ?')
        .bind(rating, comment, updatedAt, review.id)
        .run();

      return json({
        review: reviewFromRow({ ...review, rating, comment, updated_at: updatedAt })
      });
    }

    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(review.id).run();
      return json({ ok: true });
    }

    throw new ApiError('Método no permitido.', 405);
  }

  throw new ApiError('Ruta no encontrada.', 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ error: error.message }, error.status);
      }
      console.error('Error inesperado:', error);
      return json({ error: 'Error interno del servidor.' }, 500);
    }
  }
};

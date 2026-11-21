import type { MediaType } from '../models/media.model';
import type { UserRole } from '../models/user.model';

export const APP_NAME = 'CritiCut';

/** Claves de persistencia local (solo el token de la sesión en la nube). */
export const STORAGE_KEYS = {
  token: 'criticut.token'
} as const;

/** Límites de validación de todos los formularios. */
export const LIMITS = {
  nameMin: 2,
  nameMax: 16,
  emailMax: 100,
  passwordMin: 6,
  passwordMax: 16,
  commentMin: 5,
  commentMax: 100,
  searchMin: 2,
  searchMax: 80,
  ratingMin: 1,
  ratingMax: 10
} as const;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** El nombre de usuario y la contraseña no pueden contener espacios. */
export const NO_SPACES_REGEX = /^\S+$/;

/** Base de las carátulas de TMDB. */
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/** Base de las imágenes de fondo (más grandes) de TMDB. */
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Usuario',
  critic: 'Crítico'
};

export const TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Película',
  tv: 'Serie'
};

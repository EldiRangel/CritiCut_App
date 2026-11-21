export type MediaType = 'movie' | 'tv';

export interface Media {
  /** Identificador interno de la base de datos local. */
  id: string;
  /** Identificador en TMDB (para evitar duplicados). */
  tmdbId: number;
  type: MediaType;
  title: string;
  overview: string;
  /** Fecha de estreno en formato YYYY-MM-DD (puede venir vacía). */
  releaseDate: string;
  posterPath: string | null;
  backdropPath: string | null;
  genres: string[];
  actors: string[];
  /** Duración en minutos (película) o por episodio (serie). */
  runtime: number | null;
  /** Puntaje promedio de TMDB (0-10). */
  tmdbRating: number;
  createdAt: string;
}

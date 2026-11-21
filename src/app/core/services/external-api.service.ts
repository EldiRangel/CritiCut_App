import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import type { Media, MediaType } from '../models/media.model';

export interface TmdbMediaResult {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
}

interface TmdbRawResult extends Omit<TmdbMediaResult, 'media_type'> {
  media_type: MediaType | 'person';
}

interface TmdbSearchResponse {
  page: number;
  results: TmdbRawResult[];
  total_pages: number;
  total_results: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbCast {
  id: number;
  name: string;
  character?: string;
}

export interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genres: TmdbGenre[];
  runtime?: number;
  episode_run_time?: number[];
  vote_average: number;
  credits?: { cast: TmdbCast[] };
}

/** Cliente de la API externa (TMDB). */
@Injectable({ providedIn: 'root' })
export class ExternalApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  get hasApiKey(): boolean {
    return !!environment.tmdbApiKey && environment.tmdbApiKey !== 'TU_API_KEY_AQUI';
  }

  async search(query: string): Promise<TmdbMediaResult[]> {
    this.ensureApiKey();
    const response = await firstValueFrom(
      this.http.get<TmdbSearchResponse>(`${this.baseUrl}/search/multi`, {
        params: {
          api_key: environment.tmdbApiKey,
          language: environment.tmdbLanguage,
          query,
          include_adult: 'false',
          page: '1'
        }
      })
    );
    return (response.results ?? [])
      .filter(
        (item): item is TmdbMediaResult =>
          item.media_type === 'movie' || item.media_type === 'tv'
      )
      .slice(0, 20);
  }

  async getDetails(type: MediaType, tmdbId: number): Promise<TmdbDetails> {
    this.ensureApiKey();
    return firstValueFrom(
      this.http.get<TmdbDetails>(`${this.baseUrl}/${type}/${tmdbId}`, {
        params: {
          api_key: environment.tmdbApiKey,
          language: environment.tmdbLanguage,
          append_to_response: 'credits'
        }
      })
    );
  }

  /** Convierte la respuesta de TMDB al modelo local. */
  toMedia(details: TmdbDetails, type: MediaType): Omit<Media, 'id' | 'createdAt'> {
    return {
      tmdbId: details.id,
      type,
      title: details.title ?? details.name ?? 'Sin título',
      overview: details.overview?.trim() || 'Sin sinopsis disponible.',
      releaseDate: details.release_date || details.first_air_date || '',
      posterPath: details.poster_path ?? null,
      backdropPath: details.backdrop_path ?? null,
      genres: (details.genres ?? []).map((genre) => genre.name),
      actors: (details.credits?.cast ?? []).slice(0, 10).map((actor) => actor.name),
      runtime: details.runtime ?? details.episode_run_time?.[0] ?? null,
      tmdbRating: details.vote_average ?? 0
    };
  }

  private ensureApiKey(): void {
    if (!this.hasApiKey) {
      throw new Error(
        'Falta la API key de TMDB. Edita src/environments/environment.ts y coloca tu clave.'
      );
    }
  }
}

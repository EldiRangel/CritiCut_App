import type { UserRole } from './user.model';

export interface Review {
  id: string;
  mediaId: string;
  userId: string;
  /** Nombre del autor al momento de escribir la reseña. */
  authorName: string;
  /** Rol del autor: usuario normal o crítico. */
  authorRole: UserRole;
  /** Puntaje de 1 a 10. */
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

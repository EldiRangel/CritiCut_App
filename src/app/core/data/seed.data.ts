import type { Media } from '../models/media.model';
import type { Review } from '../models/review.model';
import type { User } from '../models/user.model';

const seedDate = '2026-10-01T09:00:00.000Z';

export const SEED_USERS: User[] = [
  {
    id: 'user-elena',
    name: 'Elena Ríos',
    email: 'elena@criticut.com',
    password: '123456',
    role: 'user',
    createdAt: seedDate,
    updatedAt: seedDate
  },
  {
    id: 'user-diego',
    name: 'Diego Salas',
    email: 'diego@criticut.com',
    password: '123456',
    role: 'critic',
    createdAt: seedDate,
    updatedAt: seedDate
  },
  {
    id: 'user-ana',
    name: 'Ana Torres',
    email: 'ana@criticut.com',
    password: '123456',
    role: 'user',
    createdAt: seedDate,
    updatedAt: seedDate
  },
  {
    id: 'user-marco',
    name: 'Marco Ruiz',
    email: 'marco@criticut.com',
    password: '123456',
    role: 'critic',
    createdAt: seedDate,
    updatedAt: seedDate
  }
];

const mediaDate = '2026-10-20T10:00:00.000Z';

export const SEED_MEDIA: Media[] = [
  {
    id: 'media-origen',
    tmdbId: 27205,
    type: 'movie',
    title: 'Origen',
    overview:
      'Dom Cobb es un ladrón experto en el arte de la extracción: robar secretos desde los sueños. Su última misión consiste en lo contrario, implantar una idea en la mente de un heredero, con la promesa de recuperar su vida.',
    releaseDate: '2010-07-16',
    posterPath: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdropPath: null,
    genres: ['Acción', 'Ciencia ficción', 'Suspense'],
    actors: [
      'Leonardo DiCaprio',
      'Joseph Gordon-Levitt',
      'Elliot Page',
      'Tom Hardy',
      'Ken Watanabe',
      'Cillian Murphy'
    ],
    runtime: 148,
    tmdbRating: 8.4,
    createdAt: mediaDate
  },
  {
    id: 'media-interstellar',
    tmdbId: 157336,
    type: 'movie',
    title: 'Interstellar',
    overview:
      'En un futuro donde la Tierra se está volviendo inhabitable, un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad. El amor y el tiempo se convierten en fuerzas impredecibles.',
    releaseDate: '2014-11-07',
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: null,
    genres: ['Aventura', 'Drama', 'Ciencia ficción'],
    actors: [
      'Matthew McConaughey',
      'Anne Hathaway',
      'Jessica Chastain',
      'Michael Caine',
      'Casey Affleck'
    ],
    runtime: 169,
    tmdbRating: 8.4,
    createdAt: mediaDate
  },
  {
    id: 'media-dark-knight',
    tmdbId: 155,
    type: 'movie',
    title: 'El caballero oscuro',
    overview:
      'Batman se enfrenta al Joker, un criminal anárquico que desata el caos en Gotham City. Para detenerlo, el Caballero Oscuro deberá enfrentar sus propios límites y el precio de ser un héroe.',
    releaseDate: '2008-07-18',
    posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropPath: null,
    genres: ['Acción', 'Crimen', 'Drama', 'Suspense'],
    actors: [
      'Christian Bale',
      'Heath Ledger',
      'Aaron Eckhart',
      'Michael Caine',
      'Maggie Gyllenhaal'
    ],
    runtime: 152,
    tmdbRating: 8.5,
    createdAt: mediaDate
  },
  {
    id: 'media-breaking-bad',
    tmdbId: 1396,
    type: 'tv',
    title: 'Breaking Bad',
    overview:
      'Walter White, un profesor de química diagnosticado con cáncer, decide fabricar metanfetamina para asegurar el futuro de su familia. Lo que empieza como una solución desesperada se transforma en un imperio criminal.',
    releaseDate: '2008-01-20',
    posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    backdropPath: null,
    genres: ['Drama', 'Crimen'],
    actors: [
      'Bryan Cranston',
      'Aaron Paul',
      'Anna Gunn',
      'Dean Norris',
      'Giancarlo Esposito'
    ],
    runtime: 47,
    tmdbRating: 8.9,
    createdAt: mediaDate
  }
];

const reviewDate = '2026-10-25T12:00:00.000Z';

export const SEED_REVIEWS: Review[] = [
  {
    id: 'review-origen-elena',
    mediaId: 'media-origen',
    userId: 'user-elena',
    authorName: 'Elena Ríos',
    authorRole: 'user',
    rating: 9,
    comment:
      'Un rompecabezas brillante que mejora con cada visionado. El final te deja pensando durante días.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-origen-diego',
    mediaId: 'media-origen',
    userId: 'user-diego',
    authorName: 'Diego Salas',
    authorRole: 'critic',
    rating: 10,
    comment:
      'Nolan combina acción, emoción y filosofía en una obra maestra del cine contemporáneo.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-origen-ana',
    mediaId: 'media-origen',
    userId: 'user-ana',
    authorName: 'Ana Torres',
    authorRole: 'user',
    rating: 8,
    comment:
      'La idea es fascinante y los efectos siguen sorprendiendo, aunque la primera mitad es densa.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-origen-marco',
    mediaId: 'media-origen',
    userId: 'user-marco',
    authorName: 'Marco Ruiz',
    authorRole: 'critic',
    rating: 9,
    comment:
      'Guion y montaje impecables. Una de esas películas que exigen toda tu atención y lo recompensan.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-interstellar-elena',
    mediaId: 'media-interstellar',
    userId: 'user-elena',
    authorName: 'Elena Ríos',
    authorRole: 'user',
    rating: 8,
    comment: 'Emotiva y ambiciosa. La relación padre-hija es el corazón de una aventura enorme.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-interstellar-diego',
    mediaId: 'media-interstellar',
    userId: 'user-diego',
    authorName: 'Diego Salas',
    authorRole: 'critic',
    rating: 9,
    comment:
      'Una odisea visual con una banda sonora inolvidable. La ciencia ficción en su forma más humana.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-interstellar-marco',
    mediaId: 'media-interstellar',
    userId: 'user-marco',
    authorName: 'Marco Ruiz',
    authorRole: 'critic',
    rating: 8,
    comment: 'El tramo final se alarga, pero las imágenes y la emoción sostienen el viaje.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-dark-knight-ana',
    mediaId: 'media-dark-knight',
    userId: 'user-ana',
    authorName: 'Ana Torres',
    authorRole: 'user',
    rating: 9,
    comment:
      'Heath Ledger es inolvidable. La película convierte un cómic en un thriller criminal serio.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-dark-knight-diego',
    mediaId: 'media-dark-knight',
    userId: 'user-diego',
    authorName: 'Diego Salas',
    authorRole: 'critic',
    rating: 10,
    comment:
      'El estándar del cine de superhéroes: guion, actuaciones y tensión en perfecto equilibrio.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-dark-knight-elena',
    mediaId: 'media-dark-knight',
    userId: 'user-elena',
    authorName: 'Elena Ríos',
    authorRole: 'user',
    rating: 9,
    comment: 'Cada escena del Joker es memorable. Mucho más que una película de superhéroes.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-breaking-bad-elena',
    mediaId: 'media-breaking-bad',
    userId: 'user-elena',
    authorName: 'Elena Ríos',
    authorRole: 'user',
    rating: 10,
    comment:
      'Una de las mejores series jamás hechas. La transformación de Walter White es escalofriante.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-breaking-bad-diego',
    mediaId: 'media-breaking-bad',
    userId: 'user-diego',
    authorName: 'Diego Salas',
    authorRole: 'critic',
    rating: 9,
    comment: 'Personajes y tensión perfectamente construidos. Cada temporada sube la apuesta.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-breaking-bad-ana',
    mediaId: 'media-breaking-bad',
    userId: 'user-ana',
    authorName: 'Ana Torres',
    authorRole: 'user',
    rating: 9,
    comment: 'Imposible dejar de verla. El ritmo y las decisiones morales te atrapan.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  },
  {
    id: 'review-breaking-bad-marco',
    mediaId: 'media-breaking-bad',
    userId: 'user-marco',
    authorName: 'Marco Ruiz',
    authorRole: 'critic',
    rating: 10,
    comment:
      'Un estudio de personaje brutal, con un final que cierra la historia de forma impecable.',
    createdAt: reviewDate,
    updatedAt: reviewDate
  }
];

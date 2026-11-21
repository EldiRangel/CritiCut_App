-- CritiCut: esquema inicial de la base de datos en la nube.
-- Cada usuario nace SIN filas en "libraries": su catálogo empieza vacío.
-- Los títulos (media) son globales para que las reseñas se compartan entre cuentas.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'critic')),
  avatar TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  tmdb_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  overview TEXT NOT NULL DEFAULT '',
  release_date TEXT NOT NULL DEFAULT '',
  poster_path TEXT,
  backdrop_path TEXT,
  genres TEXT NOT NULL DEFAULT '[]',
  actors TEXT NOT NULL DEFAULT '[]',
  runtime INTEGER,
  tmdb_rating REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (tmdb_id, type)
);

CREATE TABLE IF NOT EXISTS libraries (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL,
  PRIMARY KEY (user_id, media_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('user', 'critic')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (media_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_libraries_user ON libraries(user_id);
CREATE INDEX IF NOT EXISTS idx_libraries_media ON libraries(media_id);
CREATE INDEX IF NOT EXISTS idx_reviews_media ON reviews(media_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userName TEXT NOT NULL,
  userEmail TEXT NOT NULL,
  product TEXT NOT NULL,
  purpose TEXT NOT NULL,
  organisation TEXT,
  premiumType TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  timestamp TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    last_played TEXT NOT NULL
);
--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP TABLE IF EXISTS leaderboard;
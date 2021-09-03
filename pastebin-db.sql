CREATE TABLE suggestions (
    suggestion_id SERIAL PRIMARY KEY,
    title VARCHAR (300),
    content TEXT NOT NULL,
    name TEXT NOT NULL,
    time TIMESTAMP NOT NULL default now()
)

CREATE TABLE votes (
    vote_id SERIAL PRIMARY KEY,
    suggestion_id INTEGER,
    username TEXT NOT NULL,
    vote INTEGER,
    time TIMESTAMP NOT NULL default now(),
    CONSTRAINT fk_suggestions FOREIGN KEY (suggestion_id) REFERENCES suggestions(suggestion_id)
)

-- insert new vote for particular suggestion_id
"INSERT INTO votes (suggestion_id, username, vote) VALUES ($1, $2, $3) RETURNING *"

-- return a number of total votes for particular suggestion_id
"SELECT *, count(*) AS total_votes FROM votes WHERE suggestion_id = $1"
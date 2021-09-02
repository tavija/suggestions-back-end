CREATE TABLE pastes (
    paste_id SERIAL PRIMARY KEY,
    title VARCHAR (300),
    content TEXT NOT NULL,
    time TIMESTAMP NOT NULL default now()
)
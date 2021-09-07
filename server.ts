import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// SUGGESTIONS

//get all suggestions
app.get("/suggestions", async (req, res) => {
  const dbres = await client.query('select * from suggestions');
  res.json(dbres.rows);
});

//get suggestion by id
app.get("/suggestion/:suggestion_id", async (req, res) => {
  const id = parseInt(req.params.suggestion_id);

  const getSuggestion = await client.query(
    "SELECT * FROM suggestions WHERE suggestion_id = $1",
    [id]
  );
  const rows = getSuggestion.rows
  if (getSuggestion) {
    res.status(200).json({
      status: "success",
      data: {
        getSuggestion: rows, //only returns rows from data enabled by const rows
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a suggestion with that id identifier",
      },
    });
  }
});

//create suggestion
app.post("/suggestion", async (req, res) => {
  const { title, content, name } = req.body;
  if (typeof content === "string") {
    const createSuggestion = await client.query(
      "INSERT INTO suggestions (title, content, name) VALUES ($1,$2, $3) RETURNING *",
      [title, content, name])
    res.status(201).json({
      status: "success",
      data: {
        suggestions: createSuggestion,
      }
    });
  }
  else {
    res.status(400).json({
      status: "fail",
      data: {
        content: "A string value for suggestion text is required in your JSON body"
      }
    })
  }
})

//delete suggestion (for admin)
app.delete("/suggestion/:suggestion_id", async (req, res) => {
  const id = parseInt(req.params.suggestion_id);
  
  //DELETE will also delete any votes associated with suggestion_id because of ON DELETE CASCADE constraint
  const queryResult = await client.query("DELETE FROM suggestions WHERE suggestion_id=$1", [id]);
  const didRemove = queryResult.rowCount === 1;

  if (didRemove) {
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a suggestion with that id identifier",
      },
    });
  }
});

//VOTES

//get total of votes by suggestion id
app.get("/votes/:suggestion_id", async (req, res) => {
  const id = parseInt(req.params.suggestion_id);

  const getVotesForSuggestion = await client.query(
    "SELECT count(*) AS total_votes FROM votes WHERE suggestion_id = $1",
    [id]
  );
  const rows = getVotesForSuggestion.rows
  if (getVotesForSuggestion) {
    res.status(200).json({
      status: "success",
      data: {
        getVotesForSuggestion: rows, //only returns rows from data enabled by const rows
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find any votes for that suggestion id identifier",
      },
    });
  }
});

//create vote
app.post("/vote", async (req, res) => {
  const { suggestion_id, username } = req.body;
  if (typeof suggestion_id === "number") {
    const createVote = await client.query(
      "INSERT INTO votes (suggestion_id, username, vote) VALUES ($1, $2, 1) RETURNING *",
      [suggestion_id, username])
    res.status(201).json({
      status: "success",
      data: {
        suggestions: createVote,
      }
    });
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        content: "A number value for suggestion_id is required in your JSON body"
      }
    })
  }
})

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

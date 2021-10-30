const express = require("express");
const service = express();
service.use(express.json());
const port = 5000;
const WTF = 10; // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt#description

const fs = require("fs");
const mysql = require("mysql");

const json = fs.readFileSync("credentials.json", "utf8");
const credentials = JSON.parse(json);

const connection = mysql.createConnection(credentials);
connection.connect((error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
});

// TODO: issue queries.

connection.end();

let humanNextId = 1;
const humans = {
  [humanNextId]: {
    id: humanNextId++,
    username: "hcientist",
    screenname: "Michael Stewart he/him/his",
  },
  [humanNextId]: {
    id: humanNextId++,
    username: "twodee",
    screenname: "Chris Johnson he/him/his",
  },
};
let followersNextId = 1;
const followers = {
  [followersNextId]: {
    id: followersNextId++,
    followee: humanNextId - 2,
    follower: humanNextId - 1,
  },
};

service.listen(port, () => {
  console.log(`We're live on port ${port}!`);
});

// POST /humans that accepts a JSON body containing a new human’s username and
// screen name. It returns a JSON structure reporting the ID assigned to the new
// human.
service.post("/humans", (req, resp) => {
  const { username, screenname } = req.body;
  humans[humanNextId] = {
    id: humanNextId,
    username: username,
    screenname: screenname,
  };
  resp.json({
    ok: true,
    result: humans[humanNextId++],
  });
});

// GET /humans/:id that returns as JSON an object with the human’s screen name
// and username.
service.get("/humans/:id", (req, resp) => {
  resp.json(humans[req.params.id]);
});

// POST /follow/:followeeId/:followerId that adds a new following relationship to
// the database. It returns nothing but gives back status code 204, which means
// the operation silently succeeded.
service.post("/follow/:followeeId/:followerId", (req, resp, next) => {
  const followeeId = parseInt(req.params.followeeId, WTF);
  const followerId = parseInt(req.params.followerId, WTF);
  if (!(followeeId in humans && followerId in humans)) {
    // we have an error
    return next(resp.status(404));
  }
  followers[followersNextId] = {
    id: followersNextId,
    followee: followeeId,
    follower: followerId,
  };
  resp.status(201).json({
    ok: true,
    result: followers[followersNextId++],
  });
});

// GET /follow/:followee that returns as JSON an array of all of the
// followers of the human with username :followee .
service.get("/follow/:followee", (req, resp, next) => {
  const followeeHuman = Object.values(humans).find(
    (human) => human.username === req.params.followee
  );
  if (!followeeHuman) {
    // we have an error
    return next(resp.status(404));
  }
  const followeeId = followeeHuman.id;
  resp.json({
    ok: true,
    results: Object.values(followers).filter((relationship) => {
      return relationship.followee === followeeId;
    }),
  });
});

// DELETE /follow/:followeeId/:followerId that removes a following relationship from
// the database. It returns nothing but gives back status code 204, which means
// the operation silently succeeded.
service.delete("/follow/:followeeId/:followerId", (req, resp, next) => {
  const followeeId = parseInt(req.params.followeeId, WTF);
  const followerId = parseInt(req.params.followerId, WTF);

  const relationship = Object.values(followers).find(
    (relationship) =>
      relationship.follower === followerId &&
      relationship.followee === followeeId
  );
  if (!relationship) {
    return next(resp.status(404));
  }
  const relationshipId = relationship.id;
  if (relationshipId) {
    delete followers[relationshipId];
  }
  resp.status(204).json({
    ok: true,
  });
});

// DELETE /humans/:id that hard-deletes the human from the database, including
// any following relationships the human is involved in.
service.delete("/humans/:id", (req, resp) => {
  const humanId = parseInt(req.params.id, WTF);
  const relationshipsToTerminate = Object.keys(followers).filter(
    (relationship) =>
      relationship.followee === humanId || relationship.follower === humanId
  );
  relationshipsToTerminate.forEach(
    (relationshipId) => delete followers[relationshipId]
  );
  delete humans[humanId];
  resp.status(204).json({
    ok: true,
  });
});
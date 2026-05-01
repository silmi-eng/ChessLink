const express = require("express");
const sessions = require("express-session");
const app = express();

const session = sessions({
    secret: "SECRET",
    resave: false,
    saveUninitialized: true,
})

app.use(session);

const { BoardSystem } = require("./controllers/board.controller");
const boardSystem = new BoardSystem();

app.set("board", boardSystem);

require("./router/pages.route")(app, express);
require("./router/matchmaking.route")(app, express);

const server = require("./router/wss.route")(app, session);

module.exports = server;
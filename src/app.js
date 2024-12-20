const express = require("express");

const app = express();
const server = require("http").createServer(app);

require("./router/pages.router")(app, express, server);

module.exports = server;
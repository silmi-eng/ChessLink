const path = require("path");
const handlebars = require("express-handlebars");

module.exports = (app, express, server) => {
    const Handlebars = handlebars.create({
        extname: ".html",
        partialsDir: path.join(__dirname, "..", "views", "partials"),
        defaultLayout: false,
        helpers: { }
    });

    app.engine("html", Handlebars.engine);
    app.set("view engine", "html");
    app.set("views", path.join(__dirname, "..", "views"));
    app.use("/public", express.static(path.join(__dirname, "..", "public")));

    const { checkGameIsAvailability } = require("./socket.router")(server);

    app.get("/", (req, res, next) => res.status(200).render("index"));

    app.get("/:code/white", (req, res, next) => {
        if (!checkGameIsAvailability({
            code: req.params.code,
            status: true,
            length: 1
        })) {
            return res.status(404).redirect("/?error=game not found&message=no game found with the provided code.");
        }
           
        res.status(200).render("board", { color: "white", code: req.params.code, friend: false });
    });

    app.get("/:code/black", (req, res, next) => {
        if (!checkGameIsAvailability({
            code: req.params.code,
            status: true,
            length: 2
        })) {
            return res.status(409).redirect("/?error=game already in progress&message=You cannot join the game because it has already started.");
        }           

        res.status(200).render("board", { color: "black", code: req.params.code, friend: false })
    });

    app.get("/friend/:code/white", (req, res, next) => {
        if (!checkGameIsAvailability({
            code: req.params.code,
            status: false,
            length: 1
        })) {
            return res.status(404).redirect("/?error=game not found&message=no game found with the provided code.");
        }
           
        res.status(200).render("board", { color: "white", code: req.params.code, friend: true });
    });

    app.get("/friend/:code/black", (req, res, next) => {
        if (!checkGameIsAvailability({
            code: req.params.code,
            status: false,
            length: 2
        })) {
            return res.status(409).redirect("/?error=game already in progress&message=You cannot join the game because it has already started.");
        }           

        res.status(200).render("board", { color: "black", code: req.params.code, friend: true })
    });
};
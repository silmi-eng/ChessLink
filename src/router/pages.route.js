const path = require("path");
const handlebars = require("express-handlebars");
const { validateSession } = require("../middlewares/user.sessions");

module.exports = (app, express) => {
    const board = app.get("board");
    const Handlebars = handlebars.create({
        extname: ".html",
        partialsDir: path.join(__dirname, "..", "views", "partials"),
        defaultLayout: false,
        helpers: { 
            format: (str) => {
                return str
                    .split('-')
                    .join(' ');
            }
        }
    });

    app.engine("html", Handlebars.engine);
    app.set("view engine", "html");
    app.set("views", path.join(__dirname, "..", "views"));
    app.use("/public", express.static(path.join(__dirname, "..", "public")));

    app.get("/", validateSession, (req, res, next) => res.status(200).render("matchmaking", { user_uuid: req.session.user_uuid }));

    app.get("/board/:room_uuid", validateSession, board.checkMatchInstance, (req, res, next) => {
        res.status(200).render(
            "board",
            {
                user_uuid: req.session.user_uuid,
                room_uuid: req.params.room_uuid
            }
        )
    });

    app.get("/match-end/:status/:reason", (req, res, next) => {
        res.status(200).render(
            "match-end",
            {
                status: req.params.status,
                reason: req.params.reason
            }
        )
    })

    app.get("/errors", (req, res, next) => {
        if (!req.session.error) return res.status(200).redirect("/");

        const { error_details, code } = req.session.error;
        req.session.error = null;

        res.status(200).render(
            "error",
            {
                error: error_details,
                code: code
            }
        )
    })
};
const { validateSession } = require("../middlewares/user.sessions");
const { MatchmakingSystem } = require("../controllers/matchmaking.controller");

const matchmakingSystem = new MatchmakingSystem();

module.exports = (app, express) => {
    const board = app.get("board");

    app.get("/matchmaking", validateSession, (req, res, next) => {
        const user_uuid = req.session.user_uuid;
        const user_mmr = req.session.user_mmr;

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        matchmakingSystem.joinTheQueue({ user_uuid, user_mmr });

        const send = (d) => res.write(`data: ${JSON.stringify(d)}\n\n`);

        send({
            status: "wait",
            message: "searching for opponents..."
        });

        const interval = setInterval(() => {
            const result = matchmakingSystem.matchmaking({ user_uuid });
            if (!result) return;

            send(result);

            if (result.operation === "proceed-create-match") board.createMatchInstance({ room_uuid: result.details.room_uuid, players: result.details.players })
            if (result.status === "success" || result.status === "timeout") {
                clearInterval(interval);
                res.end();
            }

        }, 2000);

        req.on("close", () => { clearInterval(interval) });
    });
};
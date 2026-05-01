const http = require("http");
const url = require("url");
const WebSocket = require("ws");

module.exports = (app, session) => {
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ noServer: true });
    const board = app.get("board");

    server.on("upgrade", (req, socket, head) => session(req, {}, () => {
        if (!req.session?.user_uuid) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        const parsed = url.parse(req.url, true);
        req.session.room = parsed.query.room;
        wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
    }));

    wss.on("connection", (ws, req, query) => {
        board.createPlayerInstance({ user_uuid: req.session.user_uuid, ws });
        board.broadcastPlayerColor({ room_uuid: req.session.room, user_uuid: req.session.user_uuid }, (color, history, fen) => {
            ws.send(JSON.stringify({
                action: 'define-color',
                color,
                history,
                fen
            }))
        })

        ws.on("message", (data) => {
            const parsed = JSON.parse(data);

            switch (parsed.action) {
                case 'move':
                    board.broadcastPlayersMoves({
                        room_uuid:  req.session.room,
                        move: parsed.move,
                        user_uuid: req.session.user_uuid,
                        fen: parsed.fen,
                        history: parsed.history
                    })
                break;
            }
        });

        ws.on("close", () => {
            board.disconnectionFromInstance({ room_uuid: req.session.room, user_uuid: req.session.user_uuid });
        });
    });

    return server;
}
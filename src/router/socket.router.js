module.exports = (server) => {
    const connection = require("socket.io")(server, { cors: { origin: "*"} });

    const { add, reconnect, remove, winUser, user } = require("../services/user.services")(connection);
    const { search, join, checkGameIsAvailability, get, rm, createR, joinR } = require("../services/matchmaking.services")(connection);

    const win = ({ code, win_color, reason, friend }) => {
        const selectedGame = get({ code });
         
        if (selectedGame !== undefined) {
            const winner = selectedGame.players.find(p => p.player === win_color);
            const defeat = selectedGame.players.find(p => p.player === win_color);
        
            if (defeat !== undefined && winner !== undefined) {
                const {socket, pts} = winUser({
                    uuid: winner.uuid,
                    reason,
                    friend
                });
    
                const socketDefeat = user({ uuid: defeat.uuid });
    
                connection.to(socket).emit("winner", {
                    redirect: true,
                    pts: pts
                });
    
                connection.to(socketDefeat).emit("defeat", {
                    redirect: true,
                });
            }

            rm({ code });
        } 
    };

    connection.on("connection", socket => {
        
        socket.on("connect-user", () => add({ socket: socket.id }));
        socket.on("reconnect-user", ({ uuid, pts }) => reconnect({ socket: socket.id, uuid, pts }));

        socket.on("matchmaking", ({ uuid }) => search({ uuid, socket: socket.id }));

        socket.on("matchmaking-friend", ({ uuid, func, code }) => {
            switch(func) {
                case "create": 
                    createR({ uuid, socket: socket.id })
                    break;
                case "join":
                    joinR({ uuid, socket: socket.id, code })
                    break;
            }
        });

        socket.on("on-join", ({code}) => join({ code, socket }));

        socket.on("move", ({ code, move, uuid }) => {
            connection.to(code).emit("opponent-move", { move, uuid });
        });

        socket.on("game-disconnected", ({code, uuid, friend}) => {
            const selectedGame = get({ code });

            if (selectedGame !== undefined) {
                if (selectedGame.players !== undefined) {
                    const selectedPlayer = selectedGame.players.find(p => p.uuid !== uuid);
                    
                    if (selectedPlayer !== undefined) {
                        const so = user({ uuid: selectedPlayer.uuid });
                        connection.to(so).emit("opponent-disconnected");
                    }
                    else
                        rm({ code });
                }
            }
        });

        socket.on("win", ({ code, win_color, reason, friend }) => win({ code, win_color, reason, friend }));

        socket.on("disconnect", () => { remove({ socket: socket.id })});
        
    });
    
    return { checkGameIsAvailability }
};
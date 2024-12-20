const { v4: uuidv4 } = require('uuid');

module.exports = (connection) => {
    const currentGames = {};

    const createR = ({uuid, socket}) => {
        const newGameCode = uuidv4();
        currentGames[newGameCode] = { 
            status: false, 
            players: [{ uuid, player: "white" }]
        };

        connection.to(socket).emit("search-status", {
            status: "created-friend",
            code: newGameCode
        });
    };

    const joinR = ({uuid, code, socket}) => {
        if (!currentGames[code].status && currentGames[code].players.length === 1) {
            currentGames[code].players.push({ uuid, player: "black" });

            connection.to(socket).emit("search-status", {
                status: "join-fiend",
                code: code
            });
        }
    };

    const search = ({uuid, socket}) => {
        const gameKeys = Object.keys(currentGames);
        var matchFound = false;

        for (const game of gameKeys) {
            if (currentGames[game].status && currentGames[game].players.length === 1) {
                matchFound = true;
                currentGames[game].players.push({ uuid, player: "black" });

                connection.to(socket).emit("search-status", {
                    status: "find",
                    code: game
                });
            }
        }

        if (!matchFound) {
            const newGameCode = uuidv4();
            currentGames[newGameCode] = { 
                status: true, 
                players: [{ uuid, player: "white" }]
            };

            connection.to(socket).emit("search-status", {
                status: "created",
                code: newGameCode
            });
        };

        return uuid;
    };

    const join = ({code, socket}) => { 
        socket.join(code);

        if (checkGameStartStatus({ code }))
            currentGames[code].status = false;

        if (checkGameIsAvailability({
            code: code,
            status: false,
            length: 2
        })) {
            connection.to(code).emit("start-game");
        };
    };

    const checkGameStartStatus = ({code}) => {
        const game = currentGames[code];

        if (game && game.status && game.players.length === 2)
            return true;

        return false;
    };

    const checkGameIsAvailability = ({code, status, length}) => {
        const game = currentGames[code];

        if (game && game.status === status && game.players.length === length) {
            return true;
        }
            
        return false;
    };

    const get = ({code}) => { return currentGames[code] };

    const rm = ({ code }) => { delete currentGames[code]; };

    return { search, join, checkGameIsAvailability, get, rm, createR, joinR }
};
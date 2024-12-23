const storage = JSON.parse(localStorage.getItem("uuid") || null);
const { uuid, pts } = storage;
var gameHasStarted = false;
var board = null;
var game = new Chess();
var gameOver = false;
var gameOverTimeOut = false;
var interval;

(() => {
    if (storage !== null) {
        socket.emit("reconnect-user", { uuid: storage.uuid, pts: storage.pts });
        return;
    }

    socket.emit("connect-user", null);
    return;
})();

const onStartTimer = ({ message }) => {
    clearInterval(interval);
    let timeRemaining = 1 * 60;

    interval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;

        operationExitClear();

        operationExit({
            message: `${message} [${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}]`
        });

        if (timeRemaining > 0) { timeRemaining-- }
        else {
            clearInterval(interval);
            gameOverTimeOut = true;
            updateBoard();
        }

    }, 1000);
};

const onDragStart = (source, piece, position, orientation) => {
    if (game.game_over()) return false;
    if (!gameHasStarted) return false;
    if (gameOver) return false;

    if ((player === "black" && piece.search(/^w/) !== -1) || (player === 'white' && piece.search(/^b/) !== -1))
        return false;

    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1))
        return false;
};

const onDrop = (source, target) => {
    var move = {
        from: source,
        to: target,
        promotion: "q"
    };

    const movement = game.move(move);
    if (movement === null) return "snapback";

    socket.emit("move", {
        move,
        code,
        uuid
    });

    updateBoard();
};

const onSnapEnd = () => board.position(game.fen());

const  inGameCheckmate = ({color}) => {
    const winner = color === "White" ? "Black" : "White";

    operationExit({ 
        message: `<span class='system'>[System]</span> Game over, ${color} is checkmated. ${winner} won!`
    });

    socket.emit("win", {
        code,
        win_color: winner,
        reason: "win",
        friend
    });
};

const inGameDraw = () => {
    operationExit({ 
        message: `<span class='system'>[System]</span> Game over, position tied.`
    });

    setInterval(() => {
        socket.emit("win", {
            code,
            win_color: player,
            reason: "win-by-tied",
            friend
        });
    }, 1000);
};

const inGameOver = () => {
    operationExit({ 
        message: `<span class='system'>[System]</span> Opponent disconnected, you win!`
    });

    setInterval(() => {
        socket.emit("win", {
            code,
            win_color: player,
            reason: "win-by-disconnected",
            friend
        });
    }, 1000);
};

const inGameTimeout = () => {
    operationExit({ 
        message: `<span class='system'>[System]</span> Your opponent took too long to play. You win!`
    });

    setInterval(() => {
        socket.emit("win", {
            code,
            win_color: player,
            reason: "win-by-timeout",
            friend
        });
    }, 1000);
};

const updateBoard = () => {
    operationExitClear();
    var color = "White";

    if (game.turn() === "b")
        color = "Black"

    if (game.in_checkmate()) inGameCheckmate({ color })
    else if (game.in_draw()) inGameDraw()
    else if (gameOver) inGameOver()
    else if (gameOverTimeOut) inGameTimeout()
    else if (!gameHasStarted) {
        operationExit({ message: "<span class='system'>[System]</span> Waiting for another player join" });
    }
    else {
        if ((color === "White" && player === "white") || 
        (color === "Black" && player === "black")) {
            onStartTimer({
                message: "<span class='system'>[System]</span> Your turn"
            });
        } else {
            onStartTimer({ 
                message: "<span class='system'>[System]</span> Opponent turn"
            });
        }
    }

    if (game.pgn().trim() !== "") {
        document.getElementById("moves").innerHTML = game.pgn();
    };
};

const config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/public/img/chesspieces/{piece}.png'
};

board = Chessboard("Board", config);

if (player == "black")
    board.flip();

updateBoard();

socket.on("opponent-move", ({move, uuid}) => {
    if (storage.uuid !== uuid) {
        game.move(move);
        board.position(game.fen());
        updateBoard();
    } 
});

socket.on("start-game", () => {         
    operationExit({ message: "<span class='system'>[System]</span> Opponent connected" });       
    gameHasStarted = true;
    updateBoard();
});

socket.on("opponent-disconnected", () => {
    operationExit({ message: "<span class='system'>[System]</span> Opponent connected" });
    gameOver = true;
    updateBoard();
});

socket.on("winner", ({ redirect, pts }) => {
    if (redirect) {
        storage.pts = pts;
        localStorage.setItem("uuid", JSON.stringify(storage));
        window.location.href = `/`;
    }
});

socket.on("defeat", ({ redirect}) => {
    if (redirect) {
        window.location.href = `/`;
    }
});

window.addEventListener("popstate", (event) => { 
    socket.emit("game-disconnected", { code, uuid }); 
});

window.addEventListener("beforeunload", (event) => {
    socket.emit("game-disconnected", { code, uuid });
});
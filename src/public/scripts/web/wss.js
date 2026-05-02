const room = window.location.pathname.split("/").pop();
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}?room=${room}`);
const chessBoard = new ChessBoardEvents();

ws.onmessage = (event) => {
    const parsed = JSON.parse(event.data);

    switch (parsed.action) {
        case 'define-color':
            chessBoard.defineChessboard({ color: parsed.color, history: parsed.history, fen: parsed.fen }, ({ movement, fen, history }) => {
                
                ws.send(JSON.stringify({
                    action: "move",
                    move: movement,
                    fen,
                    history
                }))
            })
            break;
        
        case 'op-move':
            chessBoard.opMovement({ movement: parsed.move })
            break;

        case 'wining-disconnected':
            window.location.replace("/match-end/winner/victory-by-forfeiture");
            break;
    }
}
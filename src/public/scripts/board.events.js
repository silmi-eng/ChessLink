class ChessBoardEvents {
    constructor() {
        this.game_started = false;
        this.board= null;
        this.game = new Chess();
        this.game_over = false;
        this.player_color = null;
        this.movements = [];

        this.configuration = {
            draggable: true,
            position: 'start',
            onDragStart: this.onDragStart,
            onDrop: this.onDrop,
            onSnapEnd: this.onSnapEnd,
            pieceTheme: '/public/assets/chesspieces/{piece}.png'
        }

        this.callback_movements = () => {};

        document.getElementById("resign-game").addEventListener("click", () => window.location.replace("/"))
    }

    opMovement = ({ movement }) => {
        this.game.move(movement);
        this.board.position(this.game.fen());
        this.#update();
    }

    defineChessboard = ({ color, history, fen }, callback) => {
        this.board = Chessboard("board", this.configuration);
        this.player_color = color;
        this.callback_movements = callback;

        if (this.player_color === "black")
            this.board.flip();

        this.game_started = true;

        if (fen !== null) {
            this.game.load(fen);
            this.board.position(this.game.fen());
            this.createMovementsHistory({ movements: history });
        }

        this.#update();
    }

    onDragStart = (source, piece, position, orientation) => {
        if (this.game.game_over()) return false;
        if (!this.game_started) return false;
        if (this.game_over) return false;

        if ((this.player_color === "black" && piece.search(/^w/) !== -1) || (this.player_color === "white" && piece.search(/^b/) !== -1)) 
            return false;

        if ((this.game.turn() === 'w' && piece.search(/^b/) !== -1) || (this.game.turn() === 'b' && piece.search(/^w/) !== -1))
            return false;

        const moves = this.game.moves({ square: source, verbose: true });
        this.highlightSquares(moves);
    };

    onDrop = (source, target) => {
        const movement = {  from: source, to: target, promotion: "q" };

        const moving = this.game.move(movement);
        if (moving === null) return "snapback";

        this.callback_movements({ movement, fen: this.game.fen(), history: this.game.history() });
        this.#update();
    };

    onSnapEnd = () => this.board.position(this.game.fen());

    #update = () => {
        var color_play = "white";
        if (this.game.turn() === "b") color_play = "black";

        if (this.game.in_checkmate()) {
            if (this.game.turn() === this.player_color) 
                window.location.replace("/match-end/loser/defeat-by-checkmate");
            else
                window.location.replace("/match-end/winner/victory-by-checkmate");
        }
        else if (this.game.in_draw()) 
            window.location.replace("/match-end/draw/they-lost-the-game-by-a-draw.");
        else if (this.game_over) 
            window.location.replace("/match-end/loser/lost-the-game");
        else if (!this.game_started) {
            console.log('Waiting for another player join');
        }
        else
            this.toggleTurnMovements({ color_play });

        this.createMovementsHistory({ movements: [this.game.history().pop()] });
    }
    
    highlightSquares = (moves) => {
        document.querySelectorAll(".highlight-square")
            .forEach(el => el.classList.remove("highlight2-9c5d2"));

        moves.forEach(move => {
            const square = document.querySelector(`.square-${move.to}`);

            if (square) {
                square.classList.add("highlight2-9c5d2");
            }
        });
    };

    toggleTurnMovements = ({ color_play }) => {
        const opponentMovesUI = document.getElementById("opponent-moves");
        const playerMovesUI = document.getElementById("player-moves");
        const activeClass = "active-turn";
        
        const condition = ((color_play === "white" && this.player_color === "white") || (color_play === "black" && this.player_color === "black"));
        
        if (condition) {
            playerMovesUI.classList.add(activeClass);
            opponentMovesUI.classList.remove(activeClass);
        }
        else {
            playerMovesUI.classList.remove(activeClass);
            opponentMovesUI.classList.add(activeClass);
        }
    };
    
    createMovementsHistory = ({ movements }) => {
        if (movements[0] === undefined || movements.length === 0) return;
        console.log(this.movements, movements);
        this.movements = [...this.movements, ...movements];
        
        const tbody = document.getElementById("table-body");
        const wrapper = document.getElementById("table-wrapper");
        tbody.innerHTML = "";

        let rowCount = 0;

        for (let i = 0; i < this.movements.length; i += 2) {
            rowCount++;
            const tr = document.createElement("tr");

            const index = document.createElement("td");
            index.textContent = rowCount + ".";
            tr.appendChild(index);

            const history_1 = document.createElement("td");
            history_1.textContent = this.movements[i];
            tr.appendChild(history_1);

            const history_2 = document.createElement("td");
            history_2.textContent = this.movements[i + 1] || "";
            tr.appendChild(history_2);

            tbody.appendChild(tr);
        }

        wrapper.scrollTop = wrapper.scrollHeight;
    }

}
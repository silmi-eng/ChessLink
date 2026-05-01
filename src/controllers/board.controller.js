class BoardSystem {
    constructor() {
        this.matches = new Map();
        this.players = new Map();
    }
    
    createMatchInstance = ({ room_uuid, players }) => this.matches.set(room_uuid, { players: players, history: [], start_time: Date.now(), fen: null });

    createPlayerInstance = ({ user_uuid, ws }) => {
        this.players.set(user_uuid, ws);
    }

    broadcastPlayerColor = ({ room_uuid, user_uuid }, callback) => {
        if (callback) {
            const match = this.matches.get(room_uuid);

            if (match) {
                const selected = Object.values(match.players).find(p => p.uuid === user_uuid);

                if (selected)
                    callback(selected.color, match.history, match.fen);
            }  
        }
    }

    broadcastPlayersMoves = ({ room_uuid, move, user_uuid, fen, history }) => {
        const match = this.matches.get(room_uuid);
        if (!match) return;
        
        match.history = history;
        match.fen = fen;
        this.matches.set(room_uuid, match);

        const payload = JSON.stringify({
            action: "op-move",
            move
        });

        Object.values(match.players).forEach(player => {
            if (player.uuid === user_uuid) return;

            const ws = this.players.get(player.uuid);
            if (ws?.readyState === 1) 
                ws.send(payload);
        });
    };

    checkMatchInstance = async (req, res, next) => {
        const user_uuid = req.session.user_uuid;
        const room_uuid = req.params.room_uuid;
        const match = this.matches.get(room_uuid);
        
        if (!match) {
            req.session.error = { code: 404, error_details: "Sorry... Match not found" };
            return res.status(404).redirect("/errors");
        }
            

        const exists = Object.values(match.players)
            .some(p => p.uuid === user_uuid);

        if (!exists) {
             req.session.error = { code: 403, error_details: "Sorry... You do not have access to this match." };
            return res.status(403).redirect("/errors");
        }

        next();
    };

    disconnectionFromInstance = ({ user_uuid, room_uuid }) => {
        const match = this.matches.get(room_uuid);
        if (!match) return;

        this.players.delete(user_uuid);
        const payload = JSON.stringify({ action: "disconnected-event" });

        Object.values(match.players).forEach(player => {
            if (player.uuid === user_uuid) return;

            const ws = this.players.get(player.uuid);
            if (ws?.readyState === 1) 
                ws.send(payload);

            setTimeout(() => {
                this.winingByDisconnectedState({ ws, room_uuid, p1: user_uuid, p2: player.uuid });
            }, 1000);
        });
    };

    winingByDisconnectedState = ({ ws, room_uuid, p1, p2 }) => {
        const user_disconnected = this.players.get(p1);

        if (!user_disconnected) {
            const payload = JSON.stringify({ action: "wining-disconnected" });

            if (ws?.readyState === 1) 
                ws.send(payload);

            this.matches.delete(room_uuid);
            this.players.delete(p1);
            this.players.delete(p2);
        }
    };
}

module.exports = { BoardSystem };
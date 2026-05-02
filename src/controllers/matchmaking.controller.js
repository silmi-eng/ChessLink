const { v4: uuidv4 } = require("uuid");

class MatchmakingSystem {
    constructor() {
        this.queue = [];
        this.matches = {};
        this.max_waiting = 30000;
    }

    joinTheQueue = ({ user_uuid, user_mmr }) => {
        this.queue.push({ uuid: user_uuid,  mmr: user_mmr,  join_time: Date.now() });
    }

    removeFromQueue = ({ user_uuid }) => {
        const i = this.queue.findIndex(u => u.uuid === user_uuid);
        if (i !== -1) this.queue.splice(i, 1);
    }

    matchmaking = ({ user_uuid }) => {
        const result = this.#validateMaxWaitingTime({ user_uuid });
        if (result !== null) return result;

        for (const match_code of Object.keys(this.matches)) {
            const match = this.matches[match_code];
            const exists = match.some(p => p.uuid === user_uuid);

            if (exists) {
                delete this.matches[match_code];

                return {
                    status: "success",
                    operation: "proceed",
                    details: {
                        redirect: `/board/${match_code}`,
                        room_uuid: match_code
                    }
                };
            }
        }
        
        if (this.queue.length < 2) {
            return {
                status: 'wait',
                message: "waiting for more players..." 
            };
        }        
    
        this.queue.sort((a, b) => a.mmr - b.mmr);

        let i = 0;
        
        while (i < this.queue.length -1) {
            const p1 = this.queue[i];
            const p2 = this.queue[i + 1];

            const mmr_diff = Math.abs(p1.mmr - p2.mmr);
            const waiting_time = Math.min( Date.now() - p1.join_time, Date.now() - p2.join_time);
            const dynamicMMRDiff = 100 + Math.floor(waiting_time / 1000) * 10;

            if (mmr_diff <= dynamicMMRDiff) {
                const room_uuid = uuidv4();
                this.matches[room_uuid] = [{ uuid: p1.uuid }, { uuid: p2.uuid }];
                this.queue.splice(i, 2);

                return {
                    status: "success",
                    operation: "proceed-create-match",
                    details: {
                        redirect: `/board/${room_uuid}`,
                        players: {
                            'p1': { uuid: p1.uuid, color: 'black', connected: false },
                            'p2': { uuid: p2.uuid, color: 'white', connected: true },
                        },
                        room_uuid: room_uuid
                    }
                }
            }
            else 
                i++;
        }
    }

    #validateMaxWaitingTime = ({ user_uuid }) => {
        const now = Date.now();
        const cp = this.queue.find(p => p.uuid === user_uuid);

        if (cp) {
            const waiting_time = now - cp.join_time;

            if (waiting_time > this.max_waiting) {
                this.queue = this.queue.filter(p => p.uuid !== user_uuid);

                return {
                    status: "timeout",
                    message: "waiting time expired"
                }
            }
        }

        return null;
    }
}

module.exports = { MatchmakingSystem }
const { v4: uuidv4 } = require('uuid');

module.exports = (connection) => {
    const usersConnected = {};

    const add = ({socket}) => {
        usersConnected[socket] = { uuid: uuidv4(), pts: 0 }

        connection.to(socket).emit(
            "system-op",
            { 
                uuid: usersConnected[socket].uuid,
                pts: usersConnected[socket].pts
            }
        );
    };

    const reconnect = ({socket, uuid, pts}) => {
        usersConnected[socket] = { uuid: uuid, pts: pts };

        connection.to(socket).emit(
            "system-op",
            { 
                uuid: usersConnected[socket].uuid,
                pts: usersConnected[socket].pts
            }
        );
    };

    const remove = ({socket}) => {
        delete usersConnected[socket];
    };

    const winUser = ({uuid, reason, friend}) => {
        const user = Object.keys(usersConnected).find(key => usersConnected[key].uuid === uuid);

        if (friend === "false")
            switch(reason) {
                case "win":
                    usersConnected[user].pts += 1;
                    break;
                case "win-by-tied":
                    usersConnected[user].pts += .5;
                    break;
                case "win-by-timeout":
                        usersConnected[user].pts += .5;
                        break;
                case "win-by-disconnected":
                    usersConnected[user].pts += .25;
                    break;
            }
                
        return { socket: user, pts: usersConnected[user].pts };
    };

    const user = ({uuid}) => { 
        return Object.keys(usersConnected).find(key => usersConnected[key].uuid === uuid);
    };

    return { add, reconnect, remove, winUser, user }
};
const user = document.getElementById("user-uuid");
const loader = document.getElementById("loader");
const statusE = document.getElementById("status");
const joinContainer = document.getElementById("friend-join");
const storage = JSON.parse(localStorage.getItem("uuid") || null);

(() => {
    if (storage !== null) {
        socket.emit("reconnect-user", { uuid: storage.uuid, pts: storage.pts });
        return;
    }

    socket.emit("connect-user", null);
    location.reload();
    return;
})();

document.getElementById("matchmaking").addEventListener("click", () => {
    loader.classList.toggle("display-none");
    statusE.classList.toggle("display-none");

    setTimeout(() => {
        socket.emit("matchmaking", {
            uuid: storage.uuid
        });
    }, 1000);
});

document.getElementById("friend-match").addEventListener("click", () => {
    loader.classList.toggle("display-none");
    statusE.classList.toggle("display-none");

    setTimeout(() => {
        socket.emit("matchmaking-friend", {
            uuid: storage.uuid,
            func: "create"
        });
    }, 1000);
});

const createDiv = () => {
    const span = document.createElement("span");
    span.id = "dynamic";
    span.textContent = "Join friend";

    span.addEventListener("click", createInput);
    joinContainer.innerHTML = "";
    joinContainer.appendChild(span);
};

const createInput = () => {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Code";

    document.getElementById("dynamic").style.opacity = 0;

    setTimeout(() => {
        document.getElementById("dynamic").style.opacity = 1;
        input.addEventListener("blur", createDiv);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                socket.emit("matchmaking-friend", {
                    uuid: storage.uuid,
                    func: "join",
                    code: input.value
                });
            }
        });
        joinContainer.innerHTML = "";
        joinContainer.appendChild(input);
        input.focus();
    }, 400);
};

document.getElementById("dynamic").addEventListener("click", createInput)

socket.on("system-op", ({ uuid, pts }) => {
    localStorage.setItem("uuid", JSON.stringify({ uuid, pts }));
    console.log({ uuid, pts });
    document.getElementById("user-uuid").innerHTML = `${uuid} | pts: ${pts}`;
});

socket.on("search-status", async (game) => {
    if (game.status === "created") {
        window.location.href = `/${game.code}/white`;
    }
    else if (game.status === "find") {
        window.location.href = `/${game.code}/black`;
    }
    else if (game.status === "created-friend") {
        window.location.href = `/friend/${game.code}/white`;
    }
    else if (game.status === "join-fiend") {
        window.location.href = `/friend/${game.code}/black`;
    }
});


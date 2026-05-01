let event_source = null;

const status_matchmaking = document.getElementById("message");
const loading_matchmaking = document.getElementById("loader-matchmaking");

document.getElementById("button-matchmaking").addEventListener("click", () => {
    if (event_source) event_source.close();

    status_matchmaking.innerText = "joined the queue";
    event_source = new EventSource("/matchmaking");

    event_source.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.status === "wait") 
            status_matchmaking.innerText = data.message;
        
        if (data.status === "success") {
            status_matchmaking.innerText = "match found";
            event_source.close();

            window.location.href = data.details.redirect;
        }

        if (data.status === "timeout") {
            status_matchmaking.innerText = data.message;
            loading_matchmaking.style.opacity = 0;

            event_source.close();
            setTimeout(() => status_matchmaking.innerText = "Search Match", 2000);
        }
        
    }

    event_source.onerror = () => {
        event_source.close();
    }

});

const status_friends = document.getElementById("message-friends");
const loading_friends = document.getElementById("loader-friends");
var MAX_EVENTS = 5;

var gh = document.getElementById("github-activity");

function showGithubActivity(data) {
    try {
        gh.innerHTML = ""; // Clear the contents first
        var events = [];
        for (var i = 0; i < data.length; i++) {
            var evt = data[i];
            if (evt.type == "PushEvent") {
                for (var j = 0; j < evt.payload.commits.length; j++) {
                    if (evt.payload.commits[j].author.name == "dramforever") {
                        events.push([
                            evt.repo.name,
                            evt.payload.commits[j].message,
                            evt.payload.commits[j].sha
                        ]);
                    }
                }
            }
            if (events.length > MAX_EVENTS) break;
        }
        for (var i = 0; i < MAX_EVENTS && i < events.length; i++) {
            var repoName = events[i][0], message = events[i][1], sha = events[i][2];

            var elt = document.createElement("li");
            elt.className = "clear";

            var link = document.createElement("a");
            link.className = "widget-item";
            link.href = "https://github.com/" + repoName + "/commit/" + sha;


            var msg = document.createElement("span");
            msg.className = "octicon-commit";

            if (message.split("\n").length < 2) {
                msg.textContent = message;
            } else {
                msg.textContent = message.split("\n")[0] + " ...";
            }

            link.appendChild(msg);

            var repo = document.createElement("span");
            repo.className = "widget-item-aux";
            repo.textContent = repoName.split("/")[1];

            link.appendChild(repo);
            elt.appendChild(link);
            gh.appendChild(elt);
        }
    } catch(e) {
        gh.dataset["state"] = "error";
        gh.dataset["error"] = e.toString();
    }
}

function getData(callback) {
    if(localStorage.hasOwnProperty("cached")) {
        callback(JSON.parse(localStorage.cached));
    }

    var xhr = new XMLHttpRequest();

    xhr.open("GET", "https://api.github.com/users/dramforever/events");

    if(localStorage.hasOwnProperty("etag")) {
        xhr.setRequestHeader("If-None-Match", localStorage.etag);
    }

    function errored() {
        gh.dataset["state"] = "error";
        gh.dataset["error"] = "Network error";
    }

    xhr.onload =function() {
        if(xhr.status == 200) { // OK, New data
            localStorage.etag = xhr.getResponseHeader("ETag");
            localStorage.cached = xhr.response;
            callback(JSON.parse(xhr.response));
            gh.dataset["state"] = "loaded"
        } else if(xhr.status == 304) { // OK, Cached data
            callback(JSON.parse(localStorage.cached));
            gh.dataset["state"] = "loaded"
        } else {
            errored();
        }
    };

    xhr.onerror = errored;

    xhr.send();
}

getData(showGithubActivity);

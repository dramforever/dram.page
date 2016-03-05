var MAX_EVENTS = 5;

var gh = document.getElementById("github-activity");

function showGithubActivity(data) {
    var events = [];
    for(var i = 0; i < data.length; i ++) {
        var evt = data[i];
        if(evt.type == "PushEvent") {
            for(var j = 0; j < evt.payload.commits.length; j ++) {
                events.push([
                    evt.repo.name,
                    evt.payload.commits[j].message,
                    evt.payload.commits[j].sha
                ]);
            }
        }
        if(events.length > MAX_EVENTS) break;
    }
    for(var i = 0; i < MAX_EVENTS && i < events.length; i ++) {
        var repoName = events[i][0], message = events[i][1], sha = events[i][2];

        var elt = document.createElement("div");
        elt.className = "github-activity-element github-activity-commit clear";

        var link = document.createElement("a");
        link.className = "github-activity-commit-repo";
        link.href = "https://github.com/" + repoName;
        link.textContent = repoName.split("/")[1];

        var msg = document.createElement("a");
        msg.className = "github-activity-commit-message";

        if(message.split("\n").length < 2) {
            msg.textContent = message;
        } else {
            msg.textContent = message.split("\n")[0] + " ...";
        }

        msg.href = "https://github.com/" + repoName + "/commit/" + sha;

        elt.appendChild(msg);
        elt.appendChild(link);
        gh.appendChild(elt);
    }
}

function getData(callback) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "https://api.github.com/users/dramforever/events");

    if(localStorage.hasOwnProperty("etag")) {
        xhr.setRequestHeader("If-None-Match", localStorage.etag);
    }

    function errored() {
        gh.textContent = "Error loading github activity";
    }

    xhr.onload =function() {
        if(xhr.status == 200) { // OK, New data
            localStorage.etag = xhr.getResponseHeader("ETag");
            localStorage.cached = xhr.response;
            callback(JSON.parse(xhr.response));
        } else if(xhr.status = 304) { // OK, Cached data
            callback(JSON.parse(localStorage.cached));
        } else {
            errored();
        }
    };

    xhr.onerror = errored;

    xhr.send();
}

getData(showGithubActivity);
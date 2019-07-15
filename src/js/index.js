import "babel-polyfill";
import _ from "lodash";

import "./../sass/styles.scss";

const BASE_URL = "https://studentschat.herokuapp.com/";

var loginBtn = document.getElementById("loginBtn");
var registerBtn = document.getElementById("registerBtn");
var messageInput = document.getElementById("messageInput");

var boldButton = document.getElementById("bold");
var italicButton = document.getElementById("italic");
var underlineButton = document.getElementById("underline");
var sendMessageBtn = document.getElementById("sendBtn");
var currentUserID,
    messageArray,
    users = {};

boldButton.addEventListener("click", function() {
    insertMetachars("<strong>", "</strong>");
});

italicButton.addEventListener("click", function() {
    insertMetachars("<i>", "</i>");
});

underlineButton.addEventListener("click", function() {
    insertMetachars("<u>", "</u>");
});

function insertMetachars(sStartTag, sEndTag) {
    var nSelStart = messageInput.selectionStart,
        nSelEnd = messageInput.selectionEnd,
        sOldText = messageInput.value;
    messageInput.value =
        sOldText.substring(0, nSelStart) +
        sStartTag +
        sOldText.substring(nSelStart, nSelEnd) +
        sEndTag +
        sOldText.substring(nSelEnd);
    messageInput.setSelectionRange(
        nSelStart + sStartTag.length,
        nSelEnd + sStartTag.length
    );

    messageInput.focus();
}

function createGetRequest(method, callback, errorCallback) {
    var request = new XMLHttpRequest();
    request.open("GET", BASE_URL + method, true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var response = request.responseText;
            callback(response);
        } else {
            errorCallback();
        }
    };
    request.onerror = function() {
        alert("ERROR");
    };
    request.send();
}

function createPosRequest(method, params, callback, errorCallback) {
    var request = new XMLHttpRequest();
    request.open("POST", BASE_URL + method, true);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var response = request.responseText;
            callback(response);
        } else {
            errorCallback(request.status);
        }
    };
    request.onerror = function() {
        alert("ERROR");
    };
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(params));
}

loginBtn.addEventListener("click", function() {
    var enteredName = document.getElementById("login").value;
    if (enteredName != "") {
        createGetRequest(
            "users",
            function(response) {
                var usersArray = JSON.parse(response);

                var found = usersArray.some(function(obj) {
                    currentUserID = obj.user_id;
                    return obj.username === enteredName;
                });
                console.log(currentUserID);
                if (found) {
                    var userList = document.getElementById("userList");
                    var onlineCount = document.getElementById("OnlineCount");
                    var count = 0;
                    usersArray.forEach(function(obj) {
                        users[obj.user_id] = obj.username;
                        var li = document.createElement("li");
                        li.className = "user";
                        var avatar = document.createElement("div");
                        avatar.className = "avatar";
                        avatar.innerHTML = '<img src="./images/man.png"/>';
                        var name = document.createElement("p");
                        name.className = "userName text";
                        name.innerHTML = obj.username;
                        li.appendChild(avatar);
                        li.appendChild(name);
                        if (obj.status === "active") {
                            var stat = document.createElement("p");
                            stat.className = "userStatus text";
                            stat.innerHTML = "Online";
                            li.appendChild(stat);
                            count++;
                        }
                        userList.appendChild(li);
                    });

                    onlineCount.innerHTML = count;
                    document.getElementById("overlay").style.display = "none";
                    getMessages();
                } else {
                    setModalWindowHeadLine("Entered name not found", "#FF0000");
                }
            },
            function() {
                alert("ERROR");
            }
        );
    } else {
        alert("Please enter the name");
    }
});

registerBtn.addEventListener("click", function() {
    var enteredName = document.getElementById("login").value;
    if (enteredName != "") {
        createPosRequest(
            "users/register",
            {
                username: enteredName
            },
            function(response) {
                setModalWindowHeadLine(
                    'Successful registration. Please click the "Sign In" button.',
                    "#00FF00"
                );
            },
            function(status) {
                if (status == 403) {
                    setModalWindowHeadLine(
                        "This user is already registered",
                        "#FF0000"
                    );
                } else {
                    alert("ERROR");
                }
            }
        );
    } else {
        alert("Please enter the name");
    }
});

messageInput.oninput = function() {
    var message = messageInput.value;
    document.getElementById("totalChar").innerHTML = message.length;
    document.getElementById("countLetters").innerHTML = (
        message.match(/[a-zA-ZА-Яа-яЁёа-яА-Я]/g) || []
    ).length;
    document.getElementById("invisibleChar").innerHTML = (
        message.match(/\s/g) || []
    ).length;
    document.getElementById("punctuationMark").innerHTML = (
        message.match(/[^\w\sА-Яа-яЁё]/g) || []
    ).length;
};

function setModalWindowHeadLine(text, color) {
    var modalHeadLine = document.getElementById("modalHeadLine");
    modalHeadLine.innerHTML = text;
    modalHeadLine.style.color = color;
    modalHeadLine.style.fontSize = "100%";
}

function getMessages() {
    createGetRequest(
        "messages",
        function(response) {
            var chatHistory = document.getElementById("chat-history");
            chatHistory.innerHTML = "";

            var dateOptions = {
                day: "numeric",
                month: "numeric",
                year: "2-digit"
            };

            messageArray = JSON.parse(response, function(key, value) {
                if (key == "datetime") return new Date(value);
                return value;
            });

            messageArray.forEach(function(obj, i, arr) {
                if (
                    i == 0 ||
                    obj.datetime.toLocaleString("ru", dateOptions) !=
                        arr[i - 1].datetime.toLocaleString("ru", dateOptions)
                ) {
                    var dateDivider = document.createElement("div");
                    dateDivider.className = "divider text";
                    dateDivider.innerHTML = obj.datetime.toLocaleString(
                        "ru",
                        dateOptions
                    );
                    chatHistory.appendChild(dateDivider);
                }

                var message;

                if (obj.user_id != currentUserID) {
                    message = createOtherMessageElement(obj);
                } else {
                    message = createMyMessageElement(obj);
                }

                chatHistory.appendChild(message);
            });

            chatHistory.scrollTop = chatHistory.scrollHeight;
        },
        function() {
            //TODO
        }
    );
}

sendMessageBtn.addEventListener("click", function() {
    var message = messageInput.value;
    if (message != "") {
        var d = new Date();
        createPosRequest(
            "messages",
            {
                datetime: d.toISOString(),
                message: message,
                user_id: currentUserID
            },
            function(response) {
                getMessages();
                messageInput.value = "";
            },
            function(status) {
                alert("ERROR");
            }
        );
    }
});

function createMyMessageElement(obj) {
    var messageContainer = document.createElement("div");
    messageContainer.className = "myMessage";
    var time = document.createElement("div");
    time.className = "my-message-data-time text";
    time.innerHTML = obj.datetime.toLocaleString("ru", {
        hour: "numeric",
        minute: "numeric"
    });
    var message = document.createElement("div");
    message.className = "message text";
    message.innerHTML = obj.message;
    messageContainer.appendChild(time);
    messageContainer.appendChild(message);
    return messageContainer;
}

function createOtherMessageElement(obj) {
    var messageContainer = document.createElement("div");
    messageContainer.className = "otherMessage";
    var messageInfoContainer = document.createElement("div");
    messageInfoContainer.className = "messageContainer";
    var avatar = document.createElement("div");
    avatar.className = "message-data-avatar";
    avatar.innerHTML = '<img src="./images/man.png"/>';
    var name = document.createElement("div");
    name.className = "message-data-name text";
    name.innerHTML = users[obj.user_id];
    var time = document.createElement("span");
    time.className = "other-message-data-time";
    time.innerHTML = obj.datetime.toLocaleString("ru", {
        hour: "numeric",
        minute: "numeric"
    });
    var message = document.createElement("div");
    message.className = "message text";
    message.innerHTML = obj.message;
    name.appendChild(time);
    messageInfoContainer.appendChild(name);
    messageInfoContainer.appendChild(message);
    messageContainer.appendChild(avatar);
    messageContainer.appendChild(messageInfoContainer);
    return messageContainer;
}

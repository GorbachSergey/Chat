import "babel-polyfill";
import _ from "lodash";

import "./../sass/styles.scss";

const BASE_URL = "https://studentschat.herokuapp.com/";

var loginBtn = document.getElementById("loginBtn");

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
        // Обработчик ответа в случае неудачного соеденения
    };
    request.send();
}

loginBtn.addEventListener("click", function() {
    var enteredName = document.getElementById("login").value;
    if (enteredName != "") {
        createGetRequest(
            "users",
            function(response) {
                var usersArray = JSON.parse(response);
                var found = usersArray.some(function(obj) {
                    return obj.username === enteredName;
                });

                if (found) {
                    var userList = document.getElementById("userList");
                    usersArray.forEach(function(obj) {
                        var li = document.createElement("li");
                        li.className = "user";
                        var avatar = document.createElement("div");
                        avatar.className = "avatar";
                        avatar.innerHTML = '<img src="./images/man.png"/>';
                        var name = document.createElement("div");
                        name.className = "userName text";
                        name.innerHTML = obj.username;
                        li.appendChild(avatar);
                        li.appendChild(name);
                        userList.appendChild(li);
                    });
                    document.getElementById("overlay").style.display = "none";
                } else {
                    alert("Entered name not found");
                }
            },
            function() {
                alert("ERROR");
            }
        );
    } else {
        alert("ФФФФФФФФФФФФФФФФФ");
    }
});

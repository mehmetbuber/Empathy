//Dependencies
var socket = require('socket.io');
var express = require('express');
var app = express();
var server = app.listen(80);
var io = socket(server);


//Settings
var testMode = true;

var timerDuration;
var startedSec;
var submitedSec;
var playerSec;
var keywordSec;
var maxRound = 3;

if (testMode) {
    timerDuration = 23;
    startedSec = 20;
    submitedSec = 10;
    playerSec = 8;
    keywordSec = 5;
}
else {
    timerDuration = 47;
    startedSec = 45;
    submitedSec = 15;
    playerSec = 13;
    keywordSec = 8;
}

app.use(express.static('public'));
io.sockets.on('connection', newConnection);

var userList = [];
var randomInt = 0;
var roundCount = 0;

var colorListOrigin = [];

for (var i = 0; i < 8; i++) {
    var color = new UserColor();
    color.id = i;
    color.occupied = false;
    colorListOrigin.push(color);
}

var colorList = colorListOrigin;

console.log("Running");

function newConnection(socket) {
    var clients = io.sockets.clients();
    console.log('Current players : ' + clients.server.eio.clientsCount);

    socket.on('disconnect', function () {
        console.log('Got disconnect!');
        CheckUserList();
        io.sockets.emit('username', userList);

    });
    //New User


    CheckUserList();
    socket.on('submit', GetSubmit);
    socket.on('start', startData);
    socket.on('username', SetUser);

    function GetSubmit(data) {
        try {
            //Get Submit
            for (var i = 0; i < userList.length; i++) {
                if (userList[i].id == socket.id) {
                    var submit = data.submit;
                    submit.kw = randomInt;
                    userList[i].submit = submit;
                    console.log("Username : " + userList[i].name + ", Connection Id : " + userList[i].id + ", KWlist : " + userList[i].submit.kwlist);
                }

            }
        } catch (ex) {
            console.error(ex);
        }
    }

    function startData(data) {
        socket.broadcast.emit('start', data);
        start = data.start;
        startTimer(30);
    }

    function SetUser(data) {
        var user = new User();
        var color = GetAvailableColor();
        user.id = socket.id;
        user.name = data.name;
        user.color = color.id;
        user.score = 0;
        user.submit = new Submit();
        userList.push(user);
        CheckUserList();
        console.log('New user added : ' + socket.id + ' , Name : ' + user.name + ', Color : ' + user.color);
        io.sockets.emit('username', userList);
    }
}

function startTimer(duration) {
    var round = new Round();
    round.start = start;
    randomInt = Math.floor(Math.random() * 75);
    round.roundCount = roundCount;
    var submitedKeywords = [];
    var kwPoints;
    
    var arr = []

    while(arr.length < maxRound){
        var randomnumber = Math.ceil(Math.random()*75)
        if(arr.indexOf(randomnumber) > -1) continue;
        arr[arr.length] = randomnumber;
    }



    var myCounter = new Countdown({
        seconds: timerDuration,  // number of seconds to count down
        onUpdateStatus: function (sec) {
            if (sec == startedSec) {
                //Random keyword
                console.log('Started');
            }

            if (sec == submitedSec) {
                console.log('Submited');
            }
            if (sec == playerSec) {
                CheckUserList();
                Standardization();
                submitedKeywords = GetSubmitedKeywords();
                kwPoints = GetKeywordPoints(submitedKeywords);
                CalculateScores(kwPoints);
                io.sockets.emit('results', userList);
            }
            if (sec == keywordSec) {
                var keywords = new Keywords();
                keywords.keywords = kwPoints;
                io.sockets.emit('keywords', keywords);
            }

            if (sec == 0) {
                roundCount++;
                console.log('Finished');
            }


            round.seconds = sec;
            round.keyword = arr[roundCount];
            io.sockets.emit('timer', round);
            console.log(sec);
            console.log(randomInt);
        }, // callback for each second
        onCounterEnd: function () {

        } // final action
    });

    for (var i = 0; i < 5; i++)
    {
        myCounter.start();
    }

}

//Helpers
function Standardization() {
    var standardList = [];

    for (var i = 0; i < userList.length; i++) {
        var submit = userList[i].submit;


        var kwlist = submit.kwlist;
        var cleanList = [];

        for (var j = 0; j < kwlist.length; j++) {
            var kw = kwlist[j];
            kw = TrimString(kw);
            cleanList.push(kw);
        }

        cleanList = RemoveNull(cleanList);
        cleanList = GetUniqueList(cleanList);
        submit.kwlist = cleanList;

        userList[i].submit = submit;

    }
}

function TrimString(str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            str = str.toLowerCase();
            break;
        }
    }
    return str;
}

function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null;
}

function RemoveNull(submitKwList) {
    var cleanList = [];
    for (var i = 0; i < submitKwList.length; i++) {
        if (!isEmptyOrSpaces(submitKwList[i])) {
            cleanList.push(submitKwList[i]);
        }
    }
    return cleanList;
}

function GetUniqueList(arr) {
    var u = {}, a = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
        if (!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
}

function GetSubmitedKeywords() {
    var submitKwList = [];
    for (var i = 0; i < userList.length; i++) {
        submitKwList = submitKwList.concat(userList[i].submit.kwlist);
    }
    return submitKwList;
}

function GetKeywordPoints(list) {
    var uniqueList = GetUniqueList(list);
    var keywordList = [];
    for (var i = 0; i < uniqueList.length; i++) {
        var keyword = new KeywordScore();
        var kw = uniqueList[i];
        var guess = 0;
        var score = 0;

        for (var j = 0; j < list.length; j++) {
            if (uniqueList[i] == list[j]) {
                guess++;
            }
        }

        if (guess > 1) {
            score = userList.length - guess;
        }
        else {
            score = 0;
        }

        keyword.kw = kw;
        keyword.score = score;
        console.log('Keyword : ' + keyword.kw + ', ' + 'Score : ' + keyword.score);
        keywordList.push(keyword);
    }

    keywordList.sort(function (a, b) {
        return parseFloat(a.score) - parseFloat(b.score);
    });
    keywordList.reverse();
    return keywordList;
}

function CalculateScores(kwPoints) {
    for (var i = 0; i < userList.length; i++) {
        var kwlist = userList[i].submit.kwlist;

        var score = 0;

        for (var j = 0; j < kwlist.length; j++) {
            for (var k = 0; k < kwPoints.length; k++) {
                if (kwlist[j] == kwPoints[k].kw) {
                    score = score + kwPoints[k].score;
                }
            }
        }

        userList[i].submit.score = score;
        userList[i].score += score;

        console.log('User Name: ' + userList[i].name + ', Round Score : ' + userList[i].submit.score + ', Total Score : ' + userList[i].score);
    }
}

function CheckUserList() {
    var clients = io.sockets.clients();
    if (clients.server.eio.clientsCount != userList.length) {
        for (var i = 0; i < userList.length; i++) {
            if (!clients.sockets[userList[i].id]) {
                userList.splice(i, 1);
            }
        }
        CheckColorList();
    }
}
//Objects
function KeywordScore(kw, score) {
    this.kw = kw;
    this.score = score;
}

function Round(keyword, seconds, roundCount) {
    this.seconds = seconds;
    this.keyword = keyword;
    this.roundCount = roundCount;
}

function Countdown(options) {
    var timer,
    instance = this,
    seconds = options.seconds || 10,
    updateStatus = options.onUpdateStatus || function () { },
    counterEnd = options.onCounterEnd || function () {

    };

    function decrementCounter() {
        updateStatus(seconds);
        if (seconds === 0) {
            counterEnd();
            if (roundCount < maxRound) {
                instance.start();
            }
            else
            {
                instance.stop();
                roundCount = 0;
            }
        }
        seconds--;
    }

    this.start = function () {
        clearInterval(timer);
        timer = 0;
        seconds = options.seconds;
        timer = setInterval(decrementCounter, 1000);
    };

    this.stop = function () {
        clearInterval(timer);
    };
}

function User(id, name, color, submit, score) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.score = score;
    this.submit = submit;
}

function Submit(kw, kwlist, score) {
    this.kw = kw;
    this.kwlist = kwlist;
    this.score = score;
}

function Results(users) {
    this.users = users;
}
function Keywords(keywords) {
    this.keywords = keywords;
}

function UserColor(id, occupied) {
    this.id = id;
    this.occupied = occupied;
}

function GetAvailableColor() {
    var color = new UserColor();

    for (var i = 0; i < colorList.length; i++) {
        if (!colorList[i].occupied) {
            color.id = colorList[i].id;
            color.occupied = true;
            colorList[i] = color;
            break;
        }
    }
    return color;
}

function CheckColorList() {
    colorList = colorListOrigin;

    for (var i = 0; i < colorList.length; i++) {
        colorList[i].occupied = false;
    }

    for(var i = 0; i < userList.length; i++)
    {
        colorList[userList[i].color].occupied = true;
    }
}
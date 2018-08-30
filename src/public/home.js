var keywords = [];

document.onreadystatechange = function (e) {
    if (document.readyState === 'complete') {
        Papa.parse("/keywords/movies.csv", {
            download: true,
            complete: function (results) {
                data = results.data;
                for (var i = 1; i < data.length; i++)
                {
                    keywords.push(data[i].toString());
                }
            }
        });
    }
};

var socket;
var keywordScores = [];

//Settings
var testMode = true;
var submitCount = 5;

var timerDuration;
var startedSec;
var submitedSec;
var playerSec;
var keywordSec;

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

var muted = false;
var click = new Audio("/sound/click.wav");
var joinedSound = new Audio("/sound/joined.wav");
var switchSound = new Audio("/sound/switch.wav");
var popSound = new Audio("/sound/pop.wav");
var countDown10s = new Audio("/sound/countdown_10s.wav");
var backgroudColors = {
    "colors": [
        {
            "id": 0,
            "name": "Pomegrante",
            "r": 192,
            "g": 57,
            "b": 43
        },
        {
            "id": 1,
            "name": "Peter River",
            "r": 52,
            "g": 152,
            "b": 219
        },
        {
            "id": 2,
            "name": "Emerald",
            "r": 46,
            "g": 204,
            "b": 113
        },
        {
            "id": 3,
            "name": "Carrot",
            "r": 230,
            "g": 126,
            "b": 34
        },
        {
            "id": 4,
            "name": "Green Sea",
            "r": 22,
            "g": 160,
            "b": 133
        },
        {
            "id": 5,
            "name": "Wisteria",
            "r": 142,
            "g": 68,
            "b": 73
        },
        {
            "id": 6,
            "name": "Sun Flower",
            "r": 241,
            "g": 196,
            "b": 15
        },
        {
            "id": 7,
            "name": "Blue Sea",
            "r": 44,
            "g": 62,
            "b": 80
        }
    ]
}
var userList = [];
var user;
var joined = false;
var firstRaund = true;


function GetKeyword(index) {
    var keyword = keywords[index];

    return keyword;
}

function SubmitKeywords() {
    var submit = new Submit();
    submit.kwlist = [];
    var keywordCount = 5;

    for (var i = 0; i < keywordCount; i++) {
        var kw = document.getElementById("kw-box-" + i.toString()).value;
        submit.kwlist.push(kw);
    }

    user.submit = submit;

    socket.emit('submit', user);
}

function setConnection() {
    if (testMode) {
        socket = io.connect('http://localhost:80');
    }
    else {
        socket = io.connect('http://ec2-35-166-72-133.us-west-2.compute.amazonaws.com:80');
    }
    socket.on('timer', setTimer);
    socket.on('results', GetScore);
    socket.on('username', RedirectToLobby);
    socket.on('keywords', CreateKWScores);
}

function CreateKWScores(data) {
    CreateKeywordScores(data);
}

function RedirectToLobby(data) {

    if (joined) {
        if (data.length > userList.length) {
            if (!muted) {
                joinedSound.play();
            }
        }
        CreateLobby(data);
        userList = data;
    }
}

function GetScore(data) {
    CreateResults(data);
    userList = data;
}

function CreateKeywordScores(data) {
    if (!muted) {
        switchSound.play();
    }
    var kws = data.keywords;
    var body = document.getElementById("body-div");
    body.innerHTML = "";

    var scroll = document.createElement('div');
    scroll.className = "scrollbar";
    scroll.id = "scrollbar";

    var keywordsListDiv = document.createElement('div');
    keywordsListDiv.className = "keywords-list";
    keywordsListDiv.id = "keywords-list";

    var h3Label = document.createElement('h3');
    h3Label.innerHTML = "Kelimeler";
    keywordsListDiv.appendChild(h3Label);

    for (var i = 0; i < kws.length; i++) {
        var div = document.createElement('div');
        div.className = "keyword";
        div.id = "keyword-" + i;
        div.onclick = function () { HideKeywordUsers(this.id) };;

        //Keyword users
        var keywordInfo = document.createElement('div');
        keywordInfo.className = "keyword-info";

        var kwLabel = document.createElement('label');
        kwLabel.innerHTML = kws[i].kw;
        kwLabel.className = "keyword-result";
        keywordInfo.appendChild(kwLabel);

        var br = document.createElement('br');
        keywordInfo.appendChild(br);

        var guessLabel = document.createElement('label');
        guessLabel.innerHTML = "Tahmin sayýsý : " + (userList.length - parseInt(kws[i].score));
        guessLabel.className = "guess-result";
        keywordInfo.appendChild(guessLabel);

        var br1 = document.createElement('br');
        keywordInfo.appendChild(br1);

        var pointLabel = document.createElement('label');
        pointLabel.innerHTML = "Puan : " + kws[i].score;
        pointLabel.className = "point-result";
        keywordInfo.appendChild(pointLabel);

        var keywordPlayer = document.createElement('div');
        keywordPlayer.className = "keyword-player";

        for (var j = 0; j < userList.length; j++) {
            var kwlist = userList[j].submit.kwlist;
            for (var k = 0; k < kwlist.length; k++) {
                if (kwlist[k] == kws[i].kw) {
                    var playerDiv = document.createElement('div');
                    playerDiv.className = "kw-player-div";

                    var userColorDiv = document.createElement('div');
                    userColorDiv.className = "kw-player-color";
                    userColorDiv.style.backgroundColor = 'rgb(' + backgroudColors.colors[userList[j].color].r + ',' + backgroudColors.colors[userList[j].color].g + ',' + backgroudColors.colors[userList[j].color].b + ')';
                    playerDiv.appendChild(userColorDiv);

                    //bla

                    var playerNameLabel = document.createElement('label');
                    playerNameLabel.innerHTML = userList[j].name;
                    playerNameLabel.className = "kw-player-name";
                    playerDiv.appendChild(playerNameLabel);

                    keywordPlayer.appendChild(playerDiv);
                }
            }
        }
        keywordPlayer.hidden = true;
        div.appendChild(keywordInfo);
        div.appendChild(keywordPlayer);
        keywordsListDiv.appendChild(div);
    }
    scroll.appendChild(keywordsListDiv);
    body.appendChild(scroll);
}

function JoinGame() {
    joined = true;
    user = new User();
    user.id = socket.id;
    user.name = document.getElementById("username-box").value;
    user.id = socket.id;
    user.score = 0;
    user.submit = new Submit();
    socket.emit('username', user);
}

function setTimer(data) {
    var headerDiv = document.getElementById('header-div');
    var seconds = data.seconds;
    var timer = seconds - submitedSec;

    if (seconds == timerDuration) {
        CreateLoading1();
    }

    if (seconds == startedSec) {
        if (!muted)
        {
            countDown10s.play();
        }
        CreateUI(submitCount);

        var kw = GetKeyword(data.keyword);
        Write(kw, headerDiv, "keyword-container", "keyword-letter-div", "keyword-letter-label");
    }
    else if (seconds == submitedSec) {
        if (!muted) {
            //popSound.play();
        }
        SubmitKeywords();
        CreateLoading2();
    }
    else if (seconds == 0) {
        firstRaund = false;
        CreateLobby(userList);
    }
    if (seconds >= submitedSec && seconds <= startedSec) {
        document.getElementById("counter").innerHTML = timer.toString();
    }

}

function startGame() {
    if (!muted) {
        click.play();
    }
    var round = new Round();

    var data = JSON.stringify(round);
    socket.emit('start', data);
}


//UI
function Write(str, divVar, containerClass, divClass, labelClass) {
    str = str.toUpperCase();
    words = str.split(' ');
    var chars = str.split();
    var charCount = str.length;

    for (var i = 0; i < words.length; i++) {
        var container = document.createElement('div');
        container.className = containerClass;

        if (charCount > 12)
            container.style.marginTop = '5px';
        strings = words[i].split('');

        for (var j = 0; j < strings.length; j++) {
            var div = document.createElement('div');
            div.className = divClass;
            var label = document.createElement('label');
            label.className = labelClass;
            label.innerHTML = strings[j];
            if (j == 0 && i != 0)
                div.style.marginLeft = '5px';
            if (j == strings.length - 1 && i != words.length - 1)
                div.style.marginRight = '5px';
            div.appendChild(label);
            container.appendChild(div);
        }

        divVar.appendChild(container);
    }
}

function CreateLobby(data) {
    if (!muted && !firstRaund) {
        switchSound.play();
    }
    //Game div
    var gameDiv = document.getElementById("game");
    gameDiv.className = "game";
    gameDiv.innerHTML = "";

    var containerDiv = document.createElement('div');
    containerDiv.className = "container";

    //Header div
    var headerDiv = document.createElement('div');
    headerDiv.className = "header-div";
    headerDiv.id = "header-div";

    Write('EMPATÝ', headerDiv, "logo-container", "logo-letter-div", "logo-letter-label");

    //Body div
    var bodyDiv = document.createElement('div');
    bodyDiv.id = "body-div";
    bodyDiv.className = "body-div";


    //Footer div
    var footerDiv = document.createElement('div');
    footerDiv.className = "footer-div";
    footerDiv.id = "footer-div";

    //Settings div
    var settingsDiv = document.createElement('div');
    settingsDiv.className = "settings-div";
    settingsDiv.id = "settings-div";

    settingsDiv.hidden = true;

    //Blur div
    var blurDiv = document.createElement("div");
    blurDiv.className = "blur-div";
    blurDiv.id = "blur-div";
    blurDiv.onclick = CloseSettings;
    blurDiv.hidden = true;
    gameDiv.appendChild(blurDiv);
    gameDiv.appendChild(settingsDiv);


    //User list div
    var usersDiv = document.createElement('div');
    usersDiv.className = "users-div";
    usersDiv.id = "users-div";

    //Users label
    var userCountLabel = document.createElement('h3');
    userCountLabel.innerHTML = 'Oyuncular';
    userCountLabel.id = "user-count-label";
    usersDiv.appendChild(userCountLabel);

    //Username list div
    var listDiv = document.createElement('div');
    listDiv.className = 'userlist-div';

    for (var i = 0; i < data.length; i++) {
        var userDiv = document.createElement('div');
        userDiv.className = "player-div";

        var colorDiv = document.createElement('div');
        colorDiv.className = "player-color";

        colorDiv.style.backgroundColor = 'rgb(' + backgroudColors.colors[data[i].color].r + ',' + backgroudColors.colors[data[i].color].g + ',' + backgroudColors.colors[data[i].color].b + ')';

        var nameLabel = document.createElement('player-name');
        nameLabel.innerHTML = data[i].name;
        nameLabel.className = "player-name";
        userDiv.appendChild(nameLabel);
        userDiv.appendChild(colorDiv);

        listDiv.appendChild(userDiv);
    }

    usersDiv.appendChild(listDiv);
    bodyDiv.appendChild(usersDiv);

    //Back button
    var backButton = document.createElement('div');
    backButton.className = "back-button";
    backButton.onclick = SettingsPressed;
    footerDiv.appendChild(backButton);

    //Settings button
    var settingsButton = document.createElement('div');
    settingsButton.className = "settings-button";
    settingsButton.onclick = SettingsPressed;
    footerDiv.appendChild(settingsButton);

    //Start button
    var submitButton = document.createElement('div');
    submitButton.className = "start-button";
    submitButton.id = "start-button";
    submitButton.onclick = startGame;
    footerDiv.appendChild(submitButton);

    //Volume button
    var volumeButton = document.createElement('div');
    volumeButton.className = "volume-button";
    volumeButton.id = "volume-button";
    volumeButton.onclick = VolumePressed;
    footerDiv.appendChild(volumeButton);

    //Info button
    var infoButton = document.createElement('div');
    infoButton.className = "info-button";
    infoButton.onclick = SettingsPressed;
    footerDiv.appendChild(infoButton);

    containerDiv.appendChild(headerDiv);
    containerDiv.appendChild(bodyDiv);
    containerDiv.appendChild(footerDiv);
    gameDiv.appendChild(containerDiv);

}

function CreateUI(kwCount) {
    if (!muted) {
        switchSound.play();
    }
    var gameDiv = document.getElementById("game");
    var headerDiv = document.getElementById('header-div');
    var bodyDiv = document.getElementById('body-div');
    var footerDiv = document.getElementById('footer-div');

    headerDiv.innerHTML = ''
    bodyDiv.innerHTML = '';
    footerDiv.innerHTML = '';

    //Settings div
    var settingsDiv = document.createElement('div');
    settingsDiv.className = "settings-div";
    settingsDiv.id = "settings-div";

    var closeDiv = document.createElement('div');
    closeDiv.className = "close-button";
    closeDiv.id = "close-button";
    closeDiv.innerHTML = 'x';
    closeDiv.onclick = CloseSettings;

    settingsDiv.appendChild(closeDiv);
    settingsDiv.hidden = true;

    //Blur div
    var blurDiv = document.createElement("div");
    blurDiv.className = "blur-div";
    blurDiv.id = "blur-div";
    blurDiv.onclick = CloseSettings;
    blurDiv.hidden = true;
    gameDiv.appendChild(blurDiv);
    gameDiv.appendChild(settingsDiv);

    for (var i = 0; i < kwCount; i++) {
        var kwBox = document.createElement('input');
        kwBox.id = "kw-box-" + i.toString();
        kwBox.className = "guess";
        bodyDiv.appendChild(kwBox);
    }

    //Back button
    var backButton = document.createElement('div');
    backButton.className = "back-button";
    backButton.onclick = SettingsPressed;
    footerDiv.appendChild(backButton);

    //Settings button
    var settingsButton = document.createElement('div');
    settingsButton.className = "settings-button-game";
    settingsButton.onclick = SettingsPressed;
    footerDiv.appendChild(settingsButton);

    //Counter
    var counter = document.createElement('div');
    counter.className = "counter";
    counter.id = "counter";
    footerDiv.appendChild(counter);

    //Volume button
    var volumeButton = document.createElement('div');
    volumeButton.className = "volume-button-game";
    volumeButton.id = "volume-button";
    volumeButton.onclick = VolumePressed;
    footerDiv.appendChild(volumeButton);

    //Info button
    var infoButton = document.createElement('div');
    infoButton.className = "info-button";
    infoButton.onclick = SettingsPressed;
    footerDiv.appendChild(infoButton);

}

function CreateResults(list) {
    if (!muted) {
        switchSound.play();
    }
    var gameDiv = document.getElementById("game");
    var headerDiv = document.getElementById('header-div');
    var bodyDiv = document.getElementById('body-div');
    var footerDiv = document.getElementById('footer-div');

    headerDiv.innerHTML = ''
    bodyDiv.innerHTML = '';
    footerDiv.innerHTML = '';

    Write('SONUÇLAR', headerDiv, "keyword-container", "keyword-letter-div", "keyword-letter-label");

    //Settings div
    var settingsDiv = document.createElement('div');
    settingsDiv.className = "settings-div";
    settingsDiv.id = "settings-div";

    var closeDiv = document.createElement('div');
    closeDiv.className = "close-button";
    closeDiv.id = "close-button";
    closeDiv.innerHTML = 'x';
    closeDiv.onclick = CloseSettings;

    settingsDiv.appendChild(closeDiv);
    settingsDiv.hidden = true;

    //Blur div
    var blurDiv = document.createElement("div");
    blurDiv.className = "blur-div";
    blurDiv.id = "blur-div";
    blurDiv.onclick = CloseSettings;
    blurDiv.hidden = true;
    bodyDiv.appendChild(blurDiv);
    bodyDiv.appendChild(settingsDiv);

    //User list div
    var usersDiv = document.createElement('div');
    usersDiv.className = "users-div";
    usersDiv.id = "users-div";

    //Users label
    var userCountLabel = document.createElement('h3');
    userCountLabel.innerHTML = 'Oyuncular';
    userCountLabel.id = "user-count-label";
    usersDiv.appendChild(userCountLabel);

    //Username list div
    var listDiv = document.createElement('div');
    listDiv.className = 'userlist-div';

    for (var i = 0; i < list.length; i++) {
        var userDiv = document.createElement('div');
        userDiv.className = "player-div";

        var colorDiv = document.createElement('div');
        colorDiv.className = "player-color";
        colorDiv.style.backgroundColor = 'rgb(' + backgroudColors.colors[i].r + ',' + backgroudColors.colors[i].g + ',' + backgroudColors.colors[i].b + ')';

        var nameLabel = document.createElement('player-name');
        nameLabel.innerHTML = list[i].name + '     ' + list[i].score;
        nameLabel.className = "player-name"
        userDiv.appendChild(nameLabel);
        userDiv.appendChild(colorDiv);

        listDiv.appendChild(userDiv);
    }

    usersDiv.appendChild(listDiv);
    bodyDiv.appendChild(usersDiv);

    //Back button
    var backButton = document.createElement('div');
    backButton.className = "back-button";
    backButton.onclick = SettingsPressed;
    footerDiv.appendChild(backButton);

    //Settings button
    var settingsButton = document.createElement('div');
    settingsButton.className = "settings-button";
    settingsButton.onclick = SettingsPressed;
    footerDiv.appendChild(settingsButton);

    //Start button
    var screenShot = document.createElement('div');
    screenShot.className = "screenshot";
    screenShot.id = "screenshot";
    footerDiv.appendChild(screenShot);

    //Volume button
    var volumeButton = document.createElement('div');
    volumeButton.className = "volume-button";
    volumeButton.id = "volume-button";
    volumeButton.onclick = VolumePressed;
    footerDiv.appendChild(volumeButton);

    //Info button
    var infoButton = document.createElement('div');
    infoButton.className = "info-button";
    infoButton.onclick = SettingsPressed;
    footerDiv.appendChild(infoButton);

}

function CreateLoading1() {
    var gameDiv = document.getElementById("game"); 4
    var headerDiv = document.getElementById('header-div');
    var bodyDiv = document.getElementById('body-div');
    var footerDiv = document.getElementById('footer-div');
    var startButton = document.getElementById('start-button');

    headerDiv.innerHTML = '';
    bodyDiv.innerHTML = '';
    footerDiv.hidden = true;

    Write('YÜKLENÝYOR', headerDiv, "keyword-container", "keyword-letter-div", "keyword-letter-label");

    var loadingDiv = document.createElement('div');
    loadingDiv.className = "loading";
    bodyDiv.appendChild(loadingDiv);

    var waitLabel = document.createElement('h4');
    waitLabel.innerHTML = "Oyun baþlýyor, lütfen bekleyin.";
    waitLabel.id = "results-label";
    bodyDiv.appendChild(waitLabel);
}

function CreateLoading2() {
    var gameDiv = document.getElementById("game"); 4
    var headerDiv = document.getElementById('header-div');
    var bodyDiv = document.getElementById('body-div');
    var footerDiv = document.getElementById('footer-div');
    var startButton = document.getElementById('start-button');

    headerDiv.innerHTML = '';
    bodyDiv.innerHTML = '';
    footerDiv.hidden = true;

    Write('YÜKLENÝYOR', headerDiv, "keyword-container", "keyword-letter-div", "keyword-letter-label");

    var loadingDiv = document.createElement('div');
    loadingDiv.className = "loading";
    bodyDiv.appendChild(loadingDiv);

    var waitLabel = document.createElement('h4');
    waitLabel.innerHTML = "Kelimeler toplanýyor, lütfen bekleyin.";
    waitLabel.id = "results-label";
    bodyDiv.appendChild(waitLabel);
}

//UI functions
function VolumePressed() {
    var volumeButton = document.getElementById("volume-button");
    if (muted) {
        volumeButton.style.backgroundImage = "url(/img/volume-up.png)";
        muted = false;
        click.play();
    }
    else {
        volumeButton.style.backgroundImage = "url(/img/volume-mute.png)";
        muted = true;
    }
}

function SettingsPressed() {
    var blurDiv = document.getElementById('blur-div');
    blurDiv.hidden = false;
    var settingsDiv = document.getElementById('settings-div');
    settingsDiv.hidden = false;
    if (!muted) {
        click.play();
    }

}

function CloseSettings() {
    var blurDiv = document.getElementById('blur-div');
    blurDiv.hidden = true;
    var settingsDiv = document.getElementById('settings-div');
    settingsDiv.hidden = true;
}

function HideKeywordUsers(id) {
    if (document.getElementById(id).childNodes[1].hidden) {
        document.getElementById(id).childNodes[1].hidden = false;
    }
    else {
        document.getElementById(id).childNodes[1].hidden = true;
    }
    if (!muted) {
        click.play();
    }
}

//Objects
function Round(keyword, seconds, start) {
    this.seconds = seconds;
    this.keyword = keyword;
}

function Submit(kw, kwlist, score) {
    this.kw = kw;
    this.kwlist = kwlist;
    this.score = score;
}

function User(id, name, color, submit, score) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.score = score;
    this.submit = submit;
}

function Results(users) {
    this.users = users;
}

function Keywords(keywords) {
    this.keywords = keywords;
}

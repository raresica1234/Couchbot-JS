const discord = require('discord.js');
const fs = require('fs');
const commands = require("./commands")

var Message = discord.Message;

var FILE = "data/timezone.json"

var userData = [];

var SAVE_INTERVAL = 60 * 60 * 1000;

function saveTimezone() {
    let array = [];
    for(data in userData) {
        array.push({"id": data, "timezone": userData[data]});
    }
    fs.writeFileSync(FILE, JSON.stringify(array));
}

 /**
 * @param {Message} msg
 */
function set(msg) {
    var words = msg.content.split(" ");
    if(words.length < 3) {
        msg.channel.send("Please specify timezone as (+/-)hour");
        return;
    }
    var userID = msg.author.id;
    var timezone = parseInt(words[2]);
    if(timezone >=12 || timezone <= -12) {
        msg.channel.send("Timezone is not valid.");
        return;
    }
    if(isNaN(timezone)) {
        msg.channel.send("Timezone has to be a number.");
        return;
    }
    userData[userID] = timezone;
    if(timezone >= 0) {
        msg.channel.send("Timezone set to UTC+" + timezone);            
    }else {
        msg.channel.send("Timezone set to UTC" + timezone);
    }
}

function get(msg) {
    var words = msg.content.split(" ");
    if (msg.mentions.members.array().length > 0) {
        var user = msg.mentions.members.array()[0];
        var userID = user.id;
        var timezone = userData[userID];
        if(timezone >= 0) {
            msg.channel.send("UTC+" + timezone);            
        }else {
            msg.channel.send("UTC" + timezone);
        }
        return;
    }
    if(words.length < 3) {
        msg.channel.send("Please specify user");
        return;
    }
    var username = words[2];
    for(let i = 3; i < words.length; i++){
        username += " " + words[i];
    }
    var user = msg.guild.members.find("displayName", username);
    if(!user) {
        user = msg.guild.members.find("nickname", username);
        if(!user) {
            msg.channel.send("That user does not exists!");
            return;
        }
    }
    var userID = user.id;
    var timezone = userData[userID];
    if(timezone >= 0) {
        msg.channel.send("UTC+" + timezone);            
    }else {
        msg.channel.send("UTC" + timezone);
    }
}

function localtime(msg) {
    var words = msg.content.split(" ");
    if (msg.mentions.members.array().length > 0) {
        var user = msg.mentions.members.array()[0];
        var data = userData[user.id];
        if(!data) {
            msg.channel.send("That user did not set his timezone!");
            return;
        }

        var date = new Date;
        var hours = date.getUTCHours() + data;
        while(hours >= 24) {
            hours -= 24;
        }
        var minutes = date.getUTCMinutes();
        msg.channel.send(user.displayName + "'s local time is " + hours + ":" + (minutes < 10 ? "0": "") + minutes);
        return;
    }
    if(words.length < 2) {
        msg.channel.send("Please specify user");
        return;
    }
    var username = words[1];
    for(let i = 2; i < words.length; i++){
        username += " " + words[i];
    }
    var user = msg.guild.members.find("displayName", username);
    if(!user) {
        user = msg.guild.members.find("nickname", username);
        if(!user) {
            msg.channel.send("That user does not exists!");
            return;
        }
    }
    var data = userData[user.id];
    if(!data) {
        msg.channel.send("That user did not set his timezone!");
        return;
    }
    var date = new Date;
    var hours = date.getUTCHours() + data;
    while(hours >= 24) {
        hours -= 24;
    }
    var minutes = date.getUTCMinutes();
    msg.channel.send(user.displayName + "'s local time is " + hours + ":" + (minutes < 10 ? "0": "") + minutes);
}

module.exports = {

    getData: function(id) {
        return userData[id];
    },

    load: function() {
        // Register commands
        commands.reg("!timezone set", set, 2, "sets your timezone location (UTC)");
        commands.reg("!timezone get", get, 2, "gets the timezone of the user, if user has specified it");
        commands.reg("!localtime", localtime, 2, "gets the current time of day for the specified user");

        if(fs.existsSync(FILE)) {
            let array = JSON.parse(fs.readFileSync(FILE));
            for(let arrayElement in array) {
                let user = array[arrayElement]["id"];
                let timezone = array[arrayElement]["timezone"];
                userData[user] = timezone;
            }
        }
        setInterval(saveTimezone, SAVE_INTERVAL);
    },

    save: function() {
        saveTimezone();
    }
}
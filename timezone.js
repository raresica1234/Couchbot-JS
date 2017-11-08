const discord = require('discord.js');
const fs = require('fs');
const commands = require("./commands")

var Message = discord.Message;

var FILE = "config/timezone.json"

var userData = [];

var SAVE_INTERVAL = 60 * 60 * 1000;

function save() {
    fs.writeFileSync(FILE, JSON.stringify(userData));
}

 /**
 * @param {Message} msg
 */
function set(msg) {
    let words = msg.content.split(" ");
    if(words.length < 3) {
        msg.channel.send("Please specify timezone as (+/-)hour");
        return;
    }
    let userID = msg.author.id;
    let timezone = parseInt(words[2]);
    while(timezone >= 24) {
        timezone -= 24;
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
        let user = msg.mentions.members.array()[0];
        let userID = user.id;
        let timezone = userData[userID];
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
    let username = words[2];
    let user = msg.guild.members.find("displayName", username);
    if(!user) {
        user = msg.guild.members.find("nickname", username);
        if(!user) {
            msg.channel.send("That user does not exists!");
            return;
        }
    }
    let userID = user.id;
    let timezone = userData[userID];
    if(timezone >= 0) {
        msg.channel.send("UTC+" + timezone);            
    }else {
        msg.channel.send("UTC" + timezone);
    }
}

function localtime(msg) {
    let words = msg.content.split(" ");
    if (msg.mentions.members.array().length > 0) {
        let user = msg.mentions.members.array()[0];
        let data = userData[user.id];
        if(!data) {
            msg.channel.send("That user did not set his timezone!");
            return;
        }

        let date = new Date;
        let hours = date.getUTCHours() + data;
        while(hours >= 24) {
            hours -= 24;
        }
        let minutes = date.getUTCMinutes();
        msg.channel.send(user.displayName + "'s local time is " + hours + ":" + (minutes < 10 ? "0": "") + minutes);
        return;
    }
    if(words.length < 2) {
        msg.channel.send("Please specify user");
        return;
    }
    let username = words[1];
    let user = msg.guild.members.find("displayName", username);
    if(!user) {
        user = msg.guild.members.find("nickname", username);
        if(!user) {
            msg.channel.send("That user does not exists!");
            return;
        }
    }
    let data = userData[user.id];
    if(!data) {
        msg.channel.send("That user did not set his timezone!");
        return;
    }
    let date = new Date;
    let hours = date.getUTCHours() + data;
    while(hours >= 24) {
        hours -= 24;
    }
    let minutes = date.getUTCMinutes();
    msg.channel.send(user.displayName + "'s local time is " + hours + ":" + (minutes < 10 ? "0": "") + minutes);
}

module.exports = {

    load: function() {
        // Register commands
        commands.reg("!timezone set", set, 2, "sets your timezone location (UTC)");
        commands.reg("!timezone get", get, 2, "gets the timezone of the user, if user has specified it");
        commands.reg("!localtime", localtime, 2, "gets the current time of day for the specified user");

        if(fs.existsSync(FILE)) {
            userData = JSON.parse(fs.readFileSync(FILE));
        }
        setInterval(save, SAVE_INTERVAL);
    },

    save: function() {
        save();
    }
}
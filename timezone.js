const discord = require('discord.js');
const fs = require('fs');

var Message = discord.Message;

var FILE = "config/timezone.json"

var userData = [];

var SAVE_INTERVAL = 60 * 60 * 1000;

function save() {
    fs.writeFileSync(FILE, JSON.stringify(userData));
}

module.exports = {

    load: function() {
        if(fs.existsSync(FILE)) {
            userData = JSON.parse(fs.readFileSync(FILE));
        }
        setInterval(save, SAVE_INTERVAL);
    },

    save: function() {
        save();
    },

    /**
     * @param {Message} msg
     */
    set: function(msg) {
        var words = msg.content.split(" ");
        if(words.length < 3) {
            msg.channel.send("Please specify timezone as (+/-)hour");
            return;
        }
        var userID = msg.author.id;
        var timezone = parseInt(words[2]);
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
    },

    get: function(msg) {
        var words = msg.content.split(" ");
        if(words.length < 3) {
            msg.channel.send("Please specify user");
            return;
        }
        var username = words[2];
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
    },

    localtime: function(msg) {
        var words = msg.content.split(" ");
        if(words.length < 2) {
            msg.channel.send("Please specify user");
            return;
        }
        var username = words[1];
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
}
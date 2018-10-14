const discord = require("discord.js");
const fs = require("fs")
const commands = require("./commands")
const timezone = require("./timezone")

var Message = discord.Message;
var TextChannel = discord.TextChannel;
var GuildMember = discord.GuildMember;
var Guild = discord.Guild;

var bot_id;
var user_data = [];
var level_data = [];
var last_ranks = [];
var notificationChannel = null;

var FILE_PATH = "data/level_data.json";
var NOTIFICATION_PATH = "data/notification.json";
var BACKUP_PATH = "data/level_data_backup.json";

var LEVEL_RANKS = ["Newbie", "Rookie", "General", "Lieutenant", "Major", "Colonel", "Commandant", "Captain", "Master", "God", "God+", "Quasigod", "Blight", "No-lifer"];
var LEVEL_EXPERIENCE_NEEDED = 350;
var LEVEL_RANDOM_VALUE_MIN = 15;
var LEVEL_RANDOM_VALUE_MAX = 40;
var LEVEL_TIMER = 300 * 1000; // 5 minutes

var SAVE_INTERVAL = 60 * 60 * 1000; // an hour

var LEVEL_RANK_UP = 10;

var guild;

function randomColor() {
    return Math.floor(Math.random() * 16777215);
}

function randomXp() {
    return Math.floor(Math.random() * (LEVEL_RANDOM_VALUE_MAX - LEVEL_RANDOM_VALUE_MIN))+ LEVEL_RANDOM_VALUE_MIN;
}

function tick() {
    for(user in user_data) 
        if (user_data[user]["nof"] > 0) {
            uID = user_data[user]["id"];
            let found = false;
            for (leveluser in level_data) {
                if (level_data[leveluser]["id"] == uID) {
                    level_data[leveluser]["exp"] += randomXp();
                    found = true;
                }
            }
            if (!found)
                level_data.push({"id": user_data[user]["id"], "exp": randomXp()});
        }
    user_data = [];

    for(user in level_data) {
        let found = false;
        for(user2 in last_ranks) {
            if(level_data[user]["id"] != last_ranks[user2]["id"]) {
                continue;
            }

            let supposedRank = LEVEL_RANKS[parseInt(Math.max(Math.min((level_data[user]["exp"] + LEVEL_EXPERIENCE_NEEDED)/ (10 * LEVEL_EXPERIENCE_NEEDED), LEVEL_RANKS.length - 1), 0))];
            found = true;
            if(last_ranks[user2]["rank"] != supposedRank) {
                last_ranks[user2]["rank"] = supposedRank;
                newRankNotification(user, guild);
                break;
            }
        }
        if(!found) {
            last_ranks.push({"id": level_data[user]["id"], "rank": LEVEL_RANKS[0]});
        }
    }
    save();
}

function save() {
    if(typeof(guild) != 'undefined' && guild != null) {
        let backup_users = new Array();
        if(fs.existsSync(BACKUP_PATH)) {
            backup_users = JSON.parse(fs.readFileSync(BACKUP_PATH));
        }
        for(let user = level_data.length - 1; user >= 0; user--) {
            if(guild.members.find("id", level_data[user]["id"]) == null) {
                //test if user exists in the level_data
                let found = false;
                for(user2 in backup_users) {
                    if(backup_users[user2]["id"] == level_data[user]["id"]){
                        backup_users[user2] = level_data[user];
                        found = true;
                    }
                }
                if(!found)
                    backup_users.push(level_data[user]);
            }
        }

        fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup_users));
    }

    fs.writeFileSync(FILE_PATH, JSON.stringify(level_data));
    fs.writeFileSync(NOTIFICATION_PATH, JSON.stringify(notificationChannel));
}

/**
 * @param {GuildMember} author
 * @param {TextChannel} channel
 */

function print_status(author, channel, values) {
    let name = author.user.username;
    if (typeof author.nickname != 'undefined' && author.nickname != null)
        name = author.nickname;

    let embed = new discord.RichEmbed();
    let message = "Level: " + values[0] + "\nExp: " + values[2] + "/" + LEVEL_EXPERIENCE_NEEDED.toString() +"\nRank: " + values[3]+ "\nLocal Time: " + values[4];
    embed.setAuthor(name, author.user.displayAvatarURL);
    embed.setDescription(message);
    embed.setTitle(values[1]);
    embed.setColor(randomColor());

    channel.send(embed);
}
/**
 * @param {GuildMember} author
 */
function get_data(author) {
    let newlist = level_data;
    newlist.sort(function(a, b) {
        return b["exp"] - a["exp"];
    })
    
    let time_data = timezone.getData(author.id);
    let time;
    if(time_data == undefined) {
        time = "Not set";
    } else {
        let date = new Date;
        let hours = date.getUTCHours() + time_data;
        while(hours >= 24) {
            hours -= 24;
        }
        while(hours < 0) {
            hours += 24;
        }
        let minutes = date.getUTCMinutes();
        time =  hours + ":" + (minutes < 10 ? "0": "") + minutes;
    }

    let data = [], place = 1;
    for (user in newlist) {
        if (newlist[user]["id"] == author.id) {
            data.push((Math.floor(1 + (newlist[user]["exp"] / LEVEL_EXPERIENCE_NEEDED))).toString());
            let rank = Math.floor(parseInt(data[0]) / LEVEL_RANK_UP);
            if (rank >= LEVEL_RANKS.length)
                rank = LEVEL_RANKS.length - 1;
            if (rank < 0)
                rank = 0;
            
            data.push(LEVEL_RANKS[rank]);
            data.push((newlist[user]["exp"] - (parseInt(data[0]) - 1) * LEVEL_EXPERIENCE_NEEDED).toString());
            data.push(place.toString());
            data.push(time);
            return data;
        }
        place++;
    }
    data.push("1");
    data.push(LEVEL_RANKS[0]);
    data.push("0");
    data.push("N/A");
    data.push(time);    
    return data;
}

/**
 * @param {Message} msg
 * @param {Guild} guild
 */
function newRankNotification(user, guild) {
    let author = guild.members.find("id", level_data[user]["id"]);
    if (author == null ) 
        return;
    if (author.id == bot_id && notificationChannel == null) 
        return;
    let name = author.user.username;
    if (typeof author.nickname != 'undefined' && author.nickname != null)
        name = author.nickname;

    let rank = LEVEL_RANKS[parseInt(Math.max(Math.min((level_data[user]["exp"] + LEVEL_EXPERIENCE_NEEDED) / (10 * LEVEL_EXPERIENCE_NEEDED), LEVEL_RANKS.length - 1), 0))];
    let embed = new discord.RichEmbed();
    let message = "You reached a new rank!\nYour new rank is " + rank;
    embed.setAuthor(name, author.user.displayAvatarURL);
    embed.setDescription(message);
    embed.setTitle("Congratulations!");
    embed.setColor(randomColor());

    if(!notificationChannel || typeof notificationChannel == 'undefined')
        author.send(embed);
    else {
        let channel = guild.channels.find("id", notificationChannel);
        channel.send(embed);
        channel.send("Congratulations " + author + " !");
    }   
        
}

/**
 * @param {Message} msg
 */
function status(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }
    
    if (msg.content.toLowerCase() == "!status" || msg.content.toLowerCase() == "!status "){
        // Workaround: 'msg.member' is occasionally null then user is invisible (appears offline)
        let member = msg.guild.members.find("id", msg.author.id);
        if (!member)
            return;

        let values = get_data(member);
        print_status(member, msg.channel, values);
    } else {
        if (msg.mentions.members.array().length > 0) {
            let values = get_data(msg.mentions.members.first());
            print_status(msg.mentions.members.first(), msg.channel, values);
        } else {
            let regexrank = /^(\#\d+)/g;
            let args = msg.content.substring(8, msg.content.length);
            if(args.match(regexrank)) {
                let newlist = level_data;
                newlist.sort(function(a, b) {
                    return b["exp"] - a["exp"];
                })
                let regexrank2 = /((\d+))/g
                let result = args.match(regexrank2);
                let res = parseInt(result) - 1;
                if(res < newlist.length) {
                    member = msg.guild.members.find("id", newlist[res]["id"]);
                    if(typeof member != 'undefined'){
                        let values = get_data(member);
                        print_status(member, msg.channel, values);
                    }
                } else {
                    msg.channel.send("Rank " + result.toString() + " not found.");
                }
            }
            
            let regex = /"([^"]*)"/g;
            let names = args.match(regex);
            if (!names) {
                names = args.split(" ")
                if (names.length == 0)
                    names = [args];
            } else {
                for(let i =0 ; i < names.length; i++)
                    names[i] = names[i].substring(1, names[i].length - 1);
            }

            let x = names.length > 2 ? 2 : names.length;

            for (let i=0; i < x; i++) {
                let member = msg.guild.members.find("displayName", names[i]);
                if (member) {
                    let values = get_data(member);
                    print_status(member, msg.channel, values);
                }
            }
        }
    }
}

/**
 * @param {Message} msg
 */
function top(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }
    let data = msg.content.split(" ");

    if(data.length < 2) {
        msg.channel.send("Syntax incorrect!");
        return;
    }
    if(data.length >= 3) {
        let amount1 = Math.max(parseInt(data[1]), 1);
        let amount2 = Math.max(Math.min(parseInt(data[2]), 30), 1);

        if(isNaN(amount1) || isNaN(amount2)) {
            msg.channel.send("Syntax incorrect");
            return;
        }

        let newlist = level_data;
        newlist.sort(function(a, b) {
            return b["exp"] - a["exp"];
        })

        let message = ""

        for(let i =amount1 - 1; i < amount1 + amount2; i++) {
            if(i < newlist.length) {
                let member = msg.guild.members.find("id", newlist[i]["id"]);
                if(!member)
                    message += (i + 1).toString() + ". " + "Not found" + " - Level " + (Math.floor(newlist[i]["exp"] / LEVEL_EXPERIENCE_NEEDED) + 1).toString() +"\n"
                else
                    message += (i + 1).toString() + ". " + member.displayName + " - Level " + (Math.floor(newlist[i]["exp"] / LEVEL_EXPERIENCE_NEEDED) + 1).toString() +"\n"
            }
        }

        let embed = new discord.RichEmbed();
        embed.setDescription(message);
        embed.setTitle("Top from " + amount1.toString() + " to " + (amount1 + amount2).toString());
        embed.setColor(randomColor());
        msg.channel.send(embed);
        return;
    }
    let amount = Math.max(Math.min(parseInt(data[1]), 30), 1);
    if(isNaN(amount)){
        msg.channel.send("Syntax incorrect");
        return;
    }

    let newlist = level_data;
    newlist.sort(function(a, b) {
        return b["exp"] - a["exp"];
    })
    
    let message = ""

    for(let i =0; i < amount; i++) {
        if(i < newlist.length) {
            let member = msg.guild.members.find("id", newlist[i]["id"]);
            if(!member)
                message += (i + 1).toString() + ". " + "Not found" + " - Level " + (Math.floor(newlist[i]["exp"] / LEVEL_EXPERIENCE_NEEDED) + 1).toString() +"\n"
            else
                message += (i + 1).toString() + ". " + member.displayName + " - Level " + (Math.floor(newlist[i]["exp"] / LEVEL_EXPERIENCE_NEEDED) + 1).toString() +"\n"
        }
    }

    let embed = new discord.RichEmbed();
    embed.setDescription(message);
    embed.setTitle("Top " + amount.toString());
    embed.setColor(randomColor());
    msg.channel.send(embed);
}

/**
 * @param {Message} msg
 */
function givexp(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }
    let data = msg.content.split(" ");

    if(typeof data != 'undefined' && data.length >= 3) {
        let amount = Math.max(parseInt(data[1]), 0);
        let name = data[2];
        for(let i = 3; i <= data.length - 1; i++)
            name += " " + data[i];
        
        let found = false;
        if (msg.mentions.members.array().length > 0) {
            for (user in level_data) 
                if (level_data[user]["id"] == msg.mentions.members.first().id) {
                    level_data[user]["exp"] += amount;
                    found = true;
                }
            if (!found) {
                level_data.push({"id": msg.mentions.members.first().id, "exp": amount})
            }
            msg.channel.send(amount.toString() + " xp has been sucesfully added to " + msg.mentions.members.first().displayName);
            return;
        }

        let member = msg.guild.members.find("displayName", name);
        if (member) {
            for (user in level_data) 
                if (level_data[user]["id"] == member.id) {
                    level_data[user]["exp"] += amount;
                    found = true;
                }
            if (!found)
                level_data.push({"id": member.id, "exp": amount})
            msg.channel.send(amount.toString() + " xp has been sucesfully added to " + member.displayName);
            return;
        
        }
        msg.channel.send("Member not found!");
    } else {
        msg.channel.send("Syntax incorrect!");
    }
}

/**
 * @param {Message} msg
 */
function takexp(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }
    let data = msg.content.split(" ");

    if(typeof data != 'undefined' && data.length >= 3) {
        let amount = Math.max(parseInt(data[1]), 0);
        let name = data[2];
        for(let i = 3; i <= data.length - 1; i++)
            name += " " + data[i];
        
        let found = false;
        if (msg.mentions.members.array().length > 0) {
            for (user in level_data) 
                if (level_data[user]["id"] == msg.mentions.members.first().id) {
                    if(level_data[user]["exp"] >= amount)
                        level_data[user]["exp"] -= amount;
                    else
                        level_data[user]["exp"] = 0;
                    found = true;
                }
            if (!found) {
                level_data.push({"id": msg.mentions.members.first().id, "exp": 0})
            }
            msg.channel.send(amount.toString() + " xp has been sucesfully taken from " + msg.mentions.members.first().displayName);
            return;
        }

        let member = msg.guild.members.find("displayName", name);
        if (member) {
            for (user in level_data) 
                if (level_data[user]["id"] == member.id) {
                    if(level_data[user]["exp"] >= amount)
                        level_data[user]["exp"] -= amount;
                    else
                        level_data[user]["exp"] = 0;
                    found = true;
                }
            if (!found)
                level_data.push({"id": member.id, "exp": 0})
            msg.channel.send(amount.toString() + " xp has been sucesfully taken from " + member.displayName);
            return;
        
        }
        msg.channel.send("Member not found!");
    } else {
        msg.channel.send("Syntax incorrect!");
    }
}

/**
 * @param {Message} msg
 */
function setNotificationChannel(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }
    notificationChannel = msg.channel.id;
    msg.channel.send("Notification channel set!");
}

/**
 * @param {Message} msg
 */
function clearNotificationChannel(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }
    notificationChannel = null;
    msg.channel.send("Notification channel cleared!");
}

function restore(msg) {
    if (!msg.guild) {
        msg.channel.send("You can't do that here, you must send the message from a server.");
        return;
    }

    let data = msg.content.split(" ");
    if(typeof data != 'undefined' && data.length >= 2) {
        if (msg.mentions.members.array().length > 0) {
            let member = msg.mentions.members.first();
            if(fs.existsSync(BACKUP_PATH)){
                let backup_data = JSON.parse(fs.readFileSync(BACKUP_PATH));
                
                for(let user in backup_data) {
                    if(backup_data[user]["id"] == member.user.id){
                        let found = false;
                        for(let user2 in level_data) {
                            if(backup_data[user]["id"] == level_data[user2]["id"]) {
                                level_data[user2] = backup_data[user];
                                found = true;
                            }
                        }
                        if(!found)
                            level_data.push(backup_data[user]);
                        backup_data.splice(user, 1);
                        fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup_data));
                        msg.channel.send("User restored succesfully.");
                        return;
                    }
                }
                msg.channel.send("User not found in the backup file.");
            }
        }
        let name = data[1];
        for(let i = 2; i <= data.length - 1; i++)
            name += " " + data[i];
        console.log(name);
        let member = msg.guild.members.find("displayName", name);
        if(member) {
            if(fs.existsSync(BACKUP_PATH)){
                let backup_data = JSON.parse(fs.readFileSync(BACKUP_PATH));
                
                for(let user in backup_data) {
                    if(backup_data[user]["id"] == member.user.id){
                        let found = false;
                        for(let user2 in level_data) {
                            if(backup_data[user]["id"] == level_data[user2]["id"]) {
                                level_data[user2] = backup_data[user];
                                found = true;
                            }
                        }
                        if(!found)
                            level_data.push(backup_data[user]);
                        backup_data.splice(user, 1);
                        fs.writeFileSync(BACKUP_PATH, JSON.stringify(backup_data));
                        msg.channel.send("User restored succesfully.");
                        return;
                    }
                }
                msg.channel.send("User not found in the backup file.");
            }
        } else {
            msg.channel.send("Member not found");
        }
    }
}

module.exports = {

    load: function(id, bot_guild) {
        // Register commands
        commands.reg("!status", status, 2, "displays the status of the user");
        commands.reg("!top", top, 2, "displays the top users");
        commands.reg("!givexp", givexp, 0, "gives the specified amount of xp to the user");
        commands.reg("!takexp", takexp, 0, "takes the specified amount of xp from the user");
        commands.reg("!setnotification", setNotificationChannel, 0, "blocks the output of the current channel");
        commands.reg("!clearnotification", clearNotificationChannel, 0, "clears the channel in which notifications take place");
        commands.reg("!restore", restore, 0, "restores a user which has lost his level");

        if(fs.existsSync(FILE_PATH)) {
            level_data = JSON.parse(fs.readFileSync(FILE_PATH));
            for(let user in level_data) {
                let rank = LEVEL_RANKS[parseInt(Math.max(Math.min((level_data[user]["exp"] + LEVEL_EXPERIENCE_NEEDED)/ (10 * LEVEL_EXPERIENCE_NEEDED), LEVEL_RANKS.length - 1), 0))];
                last_ranks.push({"id": level_data[user]["id"], "rank": rank});
            }
        }

        if(fs.existsSync(BACKUP_PATH)) {
            let backup_data = JSON.parse(fs.readFileSync(BACKUP_PATH));
            for(let user in backup_data) {
                let rank = LEVEL_RANKS[parseInt(Math.max(Math.min((backup_data[user]["exp"] + LEVEL_EXPERIENCE_NEEDED) / (10 * LEVEL_EXPERIENCE_NEEDED), LEVEL_RANKS.length - 1), 0))];
                last_ranks.push({"id": backup_data[user]["id"], "rank": rank});
            }
        }

        if(fs.existsSync(NOTIFICATION_PATH)) {
            notificationChannel = JSON.parse(fs.readFileSync(NOTIFICATION_PATH));
        }

        setInterval(tick, LEVEL_TIMER); // because milliseconds
        setInterval(save, SAVE_INTERVAL);
        bot_id = id;
        guild = bot_guild;
    },

    save: function() {
        save();
    },

    /**
     * @param {Message} msg
     */
    processMessage: function(msg) {
        if(msg.content.startsWith("!")) 
            return;
    
        for(user in user_data) {
            if (msg.author.id == user_data[user]["id"]) {
                user_data[user]["nof"] += 1;
                return;
            }
        }
        user_data.push({"id": msg.author.id, "nof": 1});
    }
}

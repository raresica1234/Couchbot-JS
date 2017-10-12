const Discord = require("discord.js")
const fs = require("fs")
const rights = require("./utils/rights")
const behaviour = require("./utils/behaviour")
const commands = require("./commands")
const level = require("./level");
const bot = new Discord.Client();

var botConfig = JSON.parse(fs.readFileSync('config/config.json', 'utf-8'));
var botToken = botConfig.bot_token;

bot.on("ready", () => {
    console.log('Connected!');
    console.log("Bot name: " + bot.user.username);
    console.log("Bot id: " + bot.user.id);
    rights.load();
    level.load();
    behaviour.load();
})

bot.on('message', msg => {
    let content = msg.content.toLowerCase();
    if(content.startsWith("!block") && rights.isOwner(msg.author)){
        behaviour.output_block(msg);
    } else if(content.startsWith("!unblock") && rights.isOwner(msg.author)) {
        behaviour.output_unblock(msg);
    } else if(content.startsWith("!blockxp") && rights.isOwner(msg.author)) {
        behaviour.xp_block(msg);
    } else if(content.startsWith("!unblockxp") && rights.isOwner(msg.author)) {
        behaviour.xp_unblock(msg);
    } else if (!behaviour.is_output_blocked(msg)) {
        if(content.startsWith("!help")) {
            commands.help(msg);
        }
        else if (content.startsWith("!status")) {
            level.status(msg);
        }
        else if (content.startsWith("!top")) {
            level.top(msg);
        }
        else if(content.startsWith("!givexp") && rights.isOwner(msg.author)){
            level.givexp(msg);
        }
        else if(content.startsWith("!takexp") && rights.isOwner(msg.author)){
            level.takexp(msg);
        }
    }

    if (!behaviour.is_xp_blocked(msg)) {
        level.processMessage(msg);
    }
});
  
bot.login(botToken);
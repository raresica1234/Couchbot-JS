const Discord = require("discord.js")
const fs = require("fs")

const rights = require("./utils/rights")
const behaviour = require("./utils/behaviour")
const commands = require("./commands")
const timezone = require("./timezone")
const level = require("./level");

const bot = new Discord.Client();

var botConfig = JSON.parse(fs.readFileSync('config/config.json', 'utf-8'));
var botToken = botConfig.bot_token;

//
// Disconnect the bot when the program is terminated
//
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function() {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function() {
    console.log("Disconnecting bot..")
    level.save();
    timezone.save();
    behaviour.save();
    bot.destroy();
    process.exit();
});

//
// Load modules when bot is logged in
//
bot.on("ready", () => {
    console.log('Connected!');
    console.log("Bot name: " + bot.user.username);
    console.log("Bot id: " + bot.user.id);
    rights.load();
    level.load(bot.user.id, bot.guilds.first());
    behaviour.load();
    timezone.load();
    commands.load();

    // Misc
    commands.reg("!help", commands.help, 2, "Lists all the available commands");
})


//
// Process bot message
//
bot.on('message', msg => {
    // Don't process if the message is from a bot
    if (msg.author.bot)
        return;

    commands.process(msg);

    // Process experience
    if (!behaviour.is_xp_blocked(msg)) {
        level.processMessage(msg);
    }
});

// Log in bot client
bot.login(botToken);
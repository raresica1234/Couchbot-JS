const discord = require("discord.js")

var Message = discord.Message;

module.exports = {

    /**
     * Help function
     * @param {Message} msg
     */
    help: function(msg) {
        msg.channel.send("Commands:\n!block - blocks the output of the current channel, requires owner \
        \n!unblock - unblocks the output of the current channel, requires owner \
        \n!blockxp - blocks the xp counting of the current channel, requires owner \
        \n!unblockxp - unblocks the xp counting of the current channel, requires owner \
        \n!status - displays the status of the user \
        \n!status <name/mention> - displays the status of the user \
        \n!status @rank - displays the status of the user in the specified rank \
        \n!top <count> - displays the top of the first <count> user \
        \n!top <amount1> <amount2> - displays the top from amount1 to amount1 + amount2 \
        \n!givexp <amount> <user> - gives the specified amount of xp to the user, requires owner \
        \n!takexp <amount> <user> - takes the specified amount of xp to the user, requires owner \
        \n!setnotification - sets the channel in which the notifications will take place, default is direct messages, requires owner \
        \n!clearnotification - clears the channel in which notifications take place, requires owner \
        \n!timezone get <name> - gets the timezone of the user, if user has specified it \
        \n!timezone set <value> - sets your timezone location (+/- number) ");
    }



}
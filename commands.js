const discord = require("discord.js")
const rights = require("./utils/rights")
const behaviour = require("./utils/behaviour")

// Globals
var Message = discord.Message;
var Commands = [];

// Constants
var MAX_MSG_LEN = 2000;

/**
 * Compile list of commands into one message
 * @param {Boolean} useDesc
 * @return {String} Concatenated string of command info
*/
function compileCommands(useDesc) {
    let help_msg = "Commands:";
    if(useDesc) {
        for(i in Commands) {
            let cmd = Commands[i];
            help_msg += "\n" + cmd.signature + " - " + cmd.description;

            // If message is too long, re-compile it without descriptions
            if(help_msg.length > MAX_MSG_LEN) {
                return compileCommands(false);
            }
        }
    }
    else {
        for(i in Commands) {
            let cmd = Commands[i];
            // If string becomes too long, add a '...' at the end and escape
            if((help_msg + "\n" + cmd.signature).length > (MAX_MSG_LEN - 4))
                return help_msg + "\n...";

            help_msg += "\n" + cmd.signature;
        }
    }
    return help_msg;
}

module.exports = {

    /**
     * Load function
    */
    load: function() {
        // Register behaviour commands
        this.reg("!block", behaviour.output_block, 0, "blocks the output of the current channel");
        this.reg("!unblock", behaviour.output_unblock, 0, "unblocks the output of the current channel");
        this.reg("!blockxp", behaviour.xp_block, 0, "blocks the xp counting of the current channel");
        this.reg("!unblockxp", behaviour.xp_unblock, 0, "unblocks the xp counting of the current channel");
    },

    /**
     * Help function
     * @param {Message} msg
     */
    help: function(msg) {
        let argv = msg.content.split(" ");
        if (argv.length > 1) {
            let text = "";
            argv.shift(); // Remove the command signature
            for (i in argv) {
                let arg = argv[i];
                for (j in Commands) {
                    let cmd = Commands[j];
                    if (cmd.signature.replace('!', '') == arg.replace('!', '')) {
                        text += "\n" + cmd.signature + " - " + cmd.description;
                    }
                }
            }
            msg.channel.send(text);
        }
        else {
            // Check if no commands are registered
            if(Commands.length == 0)
                return msg.channel.send("No commands registered.");

            msg.channel.send(compileCommands(true));
        }
    },

    /**
     * Register command function
     * @param {String} sig - signature, for example !help or !version
     * @param {Function} func - function to be called when the command is entered
     * @param {Integer} perms - permission level
     * @param {String} desc - description, briefly what the command does
     * @return {Boolean} whether or not the registration was successful
    */
    reg: function(sig, func, perms, desc) {
        // Check types
        Commands.forEach(function(cmd) {
            if(cmd.signature == sig) {
                return false;
                console.error("Command with signature '" + sig + "' already exists");
            }
        });
        Commands.push({
            signature: sig,
            function: func,
            permissions: perms,
            description: desc
        });
        return true;
    },

    /**
     * Process message
     * @param {Message} msg
    */
    process: function(msg) {
        content = msg.content.toLowerCase();

        // Iterate all commands in search of a matching signature
        Commands.forEach(function(cmd) {
            if(content.startsWith(cmd.signature)) {
                // Check if command has permissions, and in that case verify authority
                let r = rights.hasRights(msg.author);
                if (r > cmd.permissions)
                    return;

                // Is output blocked for non-owners?
                if (r > 0 && behaviour.is_output_blocked(msg))
                    return;

                return cmd.function(msg);
            }
        });
    }
}
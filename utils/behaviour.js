const discord = require("discord.js")
const fs = require("fs")
const commands = require("../commands")

var Message = discord.Message;

var BEHAVIOUR_LOCATION = "config/behaviour.json"

var bOutChannels = [];
var xpOutChannels = [];

/**
 * @param {Message} msg
 */
function output_unblock(msg) {
    for (let i =0; i < bOutChannels.length; i++) {
        if (bOutChannels[i] == msg.channel.id){
            msg.channel.send("Channel already unblocked!");
            return;
        }
    }
    bOutChannels.push(msg.channel.id)
    msg.channel.send("Channel unblocked.");
    module.exports.save();
}

/**
 * @param {Message} msg
 */
function output_block(msg) {
    for (let i =0; i < bOutChannels.length; i++) {
        if (bOutChannels[i] == msg.channel.id){
            bOutChannels.splice(i, 1);
            msg.channel.send("Channel has been blocked.");
            return;
        }
    }
    msg.channel.send("Channel already blocked.");
    module.exports.save();
}

/**
 * @param {Message} msg
 */
function xp_block(msg) { 
    for (let i =0; i < xpOutChannels.length; i++) {
        if (xpOutChannels[i] == msg.channel.id){
            msg.channel.send("Channel already blocked!");
            return;
        }
    }
    xpOutChannels.push(msg.channel.id)
    msg.channel.send("Channel has been blocked.");
    module.exports.save();
}

/**
 * @param {Message} msg
 */
function xp_unblock(msg) {
    for (let i =0; i < xpOutChannels.length; i++) {
        if (xpOutChannels[i] == msg.channel.id){
            xpOutChannels.splice(i, 1);
            msg.channel.send("Channel has been unblocked.");
            return;
        }
    }
    msg.channel.send("Channel already unblocked.");
    module.exports.save();
}

module.exports = {

    load: function() {
        // Register commands
        commands.reg("!block", output_block, 0, "blocks the output of the current channel");
        commands.reg("!unblock", output_unblock, 0, "unblocks the output of the current channel");
        commands.reg("!blockxp", xp_block, 0, "blocks the xp counting of the current channel");
        commands.reg("!unblockxp", xp_unblock, 0, "unblocks the xp counting of the current channel");

        if(fs.existsSync(BEHAVIOUR_LOCATION)){
            let data = JSON.parse(fs.readFileSync(BEHAVIOUR_LOCATION));
            bOutChannels = data.output_block_channels;
            xpOutChannels = data.xp_block_channels;
        }
    },

    save: function() {
        let data = {
            "output_block_channels": bOutChannels,
            "xp_block_channels": xpOutChannels
        };
        fs.writeFileSync(BEHAVIOUR_LOCATION, JSON.stringify(data));
    },

    /**
     * @param {Message} msg
     */
    is_output_blocked: function(msg) {
        for (let i = 0; i < bOutChannels.length; i++) 
            if (bOutChannels[i] == msg.channel.id)
                return false;
        return true;
    },

    /**
     * @param {Message} msg
     */
    is_xp_blocked: function(msg) {
        for (let i =0; i < xpOutChannels.length; i++) 
            if (xpOutChannels[i] == msg.channel.id)
                return true;
        return false;
    }
}
const discord = require("discord.js")
const fs = require("fs")

var Message = discord.Message;

var BEHAVIOUR_LOCATION = "config/behaviour.json"

var bOutChannels = [];
var xpOutChannels = [];

module.exports = {

    load: function() {
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
    output_unblock: function(msg) {
        for (let i =0; i < bOutChannels.length; i++) {
            if (bOutChannels[i] == msg.channel.id){
                msg.channel.send("Channel already unblocked!");
                return;
            }
        }
        bOutChannels.push(msg.channel.id)
        msg.channel.send("Channel unblocked.");
        module.exports.save();
    },
    
    /**
     * @param {Message} msg
     */
    output_block: function(msg) {
        for (let i =0; i < bOutChannels.length; i++) {
            if (bOutChannels[i] == msg.channel.id){
                bOutChannels.splice(i, 1);
                msg.channel.send("Channel has been blocked.");
                return;
            }
        }
        msg.channel.send("Channel already blocked.");
        module.exports.save();
    },
    
    /**
     * @param {Message} msg
     */
    xp_block: function(msg) { 
        for (let i =0; i < xpOutChannels.length; i++) {
            if (xpOutChannels[i] == msg.channel.id){
                msg.channel.send("Channel already blocked!");
                return;
            }
        }
        xpOutChannels.push(msg.channel.id)
        msg.channel.send("Channel has been blocked.");
        module.exports.save();
    },
    
    /**
     * @param {Message} msg
     */
    xp_unblock: function(msg) {
        for (let i =0; i < xpOutChannels.length; i++) {
            if (xpOutChannels[i] == msg.channel.id){
                xpOutChannels.splice(i, 1);
                msg.channel.send("Channel has been unblocked.");
                return;
            }
        }
        msg.channel.send("Channel already unblocked.");
        module.exports.save();
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
const discord = require("discord.js");
const fs = require("fs");

var User = discord.User;

var owners = [];
var admins = [];

/**
 * Tests if the current member has rights.
 * @param {User} user
 */
function hasRights(user) {
    for (var id in owners) {
        if (user.id == owners[id]) {
            return 0;
        }
    }
    for (var id in admins) {
        if (user.id == admins[id]) {
            return 1;
        }
    }
    return 2;
}

module.exports = {
    /**
     * Loads all owners
     */
    load: function() {
        let data = JSON.parse(fs.readFileSync("config/rights.json"));
        owners = data.owners;
        admins = data.admins;
        console.log(owners);
    },

    /**
     * Tests if the current member has rights.
     * @param {User} user
     */
    isOwner: function(user) {
        return hasRights(user) == 0;
    },

    isAdmin: function(user) {
        return hasRights(user) <= 1;
    },

    hasRights: function(user) {
        return hasRights(user);
    }
}
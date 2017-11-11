const DISCORD = require('discord.js');
const COMMANDS = require("./commands");
const GAME_CHESS = require('./games/chess.js');

/* Chess function */
function chess(msg)
{
	// Play vs bot if message is DM
	if (!msg.guild)
		return;

	let args = msg.content.split(" ");
	args.shift(); // Remove command signature
	if (args.length)
	{
		// Fetch member in guild
		let member = msg.guild.member(msg.author);
		if (member)
		{
			// Forward the command to the chess module
			GAME_CHESS.cmd(args, member, msg.channel);
		}
	}
}

/* Export module objects */
module.exports =
{
	load: function()
	{
		// Register commands
		COMMANDS.reg("!chess", chess, 2, "Chess game");
	}
}
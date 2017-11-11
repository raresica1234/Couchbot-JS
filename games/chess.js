const DISCORD = require('discord.js');

var chess_games_ = [];

/* ChessGame class */
class ChessGame
{
	constructor(playerOne, playerTwo, channel)
	{
		this.playerOne = playerOne;
		this.playerTwo = playerTwo;
		this.channel = channel;

		channel.send(playerOne + " started a chess game with " + playerTwo);
	}
}

/** Index of the game in which the specified member is playing.
	Returns -1 if the member wasn't found.
*/
function gameIndexFromMember(member)
{
	// Iterate all ongoing chess games
	for (let i = 0; i < chess_games_.length; i++)
	{
		let chess_game = chess_games_[i];

		// Is either player the specified member?
		if (chess_game.playerOne == member || chess_game.playerTwo == member)
			return i;
	}
	return -1;
}

/* Start game */
function start(args, member, channel)
{
	// Require opponent argument
	if (!args.length)
		return;
	args = args.join(" ");

	// Fetch opponent member
	let opponent = member.guild.members.find("displayName", args);
	if (!opponent)
		return channel.send(args + " is not a member of this server");

	// Make sure member isn't part of a game already
	if (gameIndexFromMember(member) != -1)
		return channel.send(member + " is already in a game!");

	let chess_game = new ChessGame(member, opponent, channel);
	chess_games_.push(chess_game);
}

/* End game */
function end(args, member, channel)
{
	let i = gameIndexFromMember(member);
	if (i != -1)
	{
		let chess_game = chess_games_[i];
		
		// Cancel game
		chess_game.channel.send("Chess game between " + chess_game.playerOne + " and " +
			chess_game.playerTwo + " has been cancelled");
		return chess_games_.splice(i);
	}

	// No ongoing game including specified member
	channel.send(member + " is not in any game right now");	
}

/* Export module objects */
module.exports =
{
	cmd: function(args, member, channel)
	{
		// Shift and store first argument
		let arg0 = args[0];
		args.shift();

		// Start game
		if (arg0 == "start")
			start(args, member, channel);
		else if (arg0 == "end")
			end(args, member, channel);
	}
}
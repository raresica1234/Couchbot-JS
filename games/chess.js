const DISCORD = require('discord.js');
const FS = require('fs');
const IMGUR_UPLOADER = require('imgur-uploader');

var chess_games_ = [];

/* ChessGame class */
class ChessGame
{
	constructor(playerOne, playerTwo, channel)
	{
		this.playerOne = playerOne;
		this.playerTwo = playerTwo;
		this.channel = channel;
		this.turn = 0;

		// Create embedded message
		this.embed = new DISCORD.RichEmbed();
		this.embed.setColor([255, 255, 255]);
		this.embed.setDescription(playerOne + " vs " + playerTwo);
		this.embed.setFooter("Footer");
		this.embed.setImage("");
		this.embed.setThumbnail(playerOne.user.avatarURL);
		this.embed.setTitle("Chess Match");

		// Send and store message
		channel.send(this.embed).then(msg =>
		{
			this.msg = msg;
		});

		IMGUR_UPLOADER(FS.readFileSync("res/chessboard.jpg"), {title: "Chessboard"}).then(data =>
		{
			if (data)
			{
				this.embed.setFooter("Footer", data.link);
				this.embed.setImage(data.link);
				if (this.msg)
					this.msg.edit(this.embed);
			}
		});

		IMGUR_UPLOADER(FS.readFileSync("res/cancelled.jpg"), {title: "Cancelled"}).then(data =>
		{
			this.imageCancelled = data.link;
		});
	}

	nextTurn()
	{
		this.turn = (this.turn + 1) % 2;
		if (this.msg)
		{
			let player = (this.turn == 0) ? this.playerOne : this.playerTwo;
			this.embed.setThumbnail(player.user.avatarURL);
			this.msg.edit(this.embed);
		}
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

		// Delete embedded message
		if (chess_game.msg)
		{
			chess_game.embed.setDescription("Game was cancelled");
			chess_game.embed.setFooter("");
			chess_game.embed.setImage("");
			if (chess_game.imageCancelled)
				chess_game.embed.setThumbnail(chess_game.imageCancelled);

			// Edit message
			chess_game.msg.edit(chess_game.embed);
		}

		// Cancel game
		return chess_games_.splice(i, 1);
	}

	// No ongoing game including specified member
	channel.send(member + " is not in any game right now");	
}

/* Next turn */
function nextTurn(args, member, channel)
{
	let i = gameIndexFromMember(member);
	if (i == -1)
		return channel.send(member + " is not in any game right now");

	let chess_game = chess_games_[i];
	chess_game.nextTurn();
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
		else if (arg0 == "nextTurn")
			nextTurn(args, member, channel);
	}
}
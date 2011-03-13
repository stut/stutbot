/*
	HANGMAN GAME
	============
*/

var utils = require('../lib/utils');

var helps = {
	'help': [
		'Start a new game by sending !hangman start <word> <#channel> [<guesses>] in a PM.',
		'Send !hangman help commands for a list of valid commands.',
	],
	'commands': [
		'These are the commands that are available. Send !hangman help <command> for detailed help.',
		'- start <word> <#channel> [<guesses>]: Send this in a PM to start a new game',
		'- guess <guess>: Submits a guess, either a single letter or the whole word/phrase',
		'- show: Shows the current progress',
		'- letters: Shows the letters that have not yet been tried',
		'- who: Tells you who started the current game and when',
		'- reveal: Reveals the answer, immediately if sent by the game starter, otherwise only after 3 separate users have sent it',
		'- cancel: Cancels the current game - only available to the game starter'
	],
	'start': [
		'!hangman start <word> <#channel> [<guesses>]',
		'- Put <word> in quotes to use multiple words',
		'- The channel must start with a #',
		'- Optionally specify the max number of guesses to allow, defaults to 12',
	],
	'guess': [
		'!hangman guess <guess>',
		'- Where <guess> is the letter or word/phrase to guess',
	],
	'show': [
		'!hangman show',
		'- Shows the current progress',
	],
	'letters': [
		'!hangman letters',
		'- Shows the letters that have not yet been tried',
	],
	'who': [
		'!hangman who',
		'- Tells you who started the current game and when',
	],
	'reveal': [
		'!hangman reveal',
		'- If sent by the game starter this command will reveal the answer and cancel the game',
		'- If sent by another user a vote is registered to reveal the answer',
		'- If this is the third vote the answer is revealed and the game is cancelled',
	],
	'cancel': [
		'!hangman cancel',
		'- Will only be accepted from the game starter, and will cause the game to be cancelled',
	],
};

var state = null;

// Load the game state, callback(error, game)
var loadGame = function(channel, callback) {
	if (state) {
		state.get('hangman', channel, function(error, game) {
			if (error) {
				callback(error);
			} else {
				if (game) {
					game = JSON.parse(game);
				} else {
					game = {
						word: null,
						started_by: null,
						started_at: null,
			            state: null,
			            guessesleft: null,
			            letters: 'abcdefghijklmnopqrstuvwxyz',
			            revealvotes: [],
					};
				}
			}

			callback(null, game);
		});
	} else {
		callback('[loadGame] State not defined!');
	}
}

// Save the game state, callback(error)
var saveGame = function(channel, game, callback) {
	if (state) {
		state.set('hangman', channel, JSON.stringify(game), function(error) {
			if (error) {
				callback(error);
			} else {
				callback(null);
			}
		});
	} else {
		callback('[saveGame] State not defined!');
	}
}

// Delete the game state, callback(error)
var deleteGame = function(channel, callback) {
	if (state) {
		state.del('hangman', channel, function(error) {
			if (error) {
				callback(error);
			} else {
				callback(null);
			}
		})
	} else {
		callback('[deleteGame] State not defined!');
	}
}

// Output the help associated with the given command
var outputHelp = function(cmd, all, irc, client, channel, nick) {
	if (all) {
		for (var i in helps[cmd]) {
			utils.sendMessage(irc, client, channel, nick, '[hangman] ' + helps[cmd][i]);
		}
	} else {
		utils.sendMessage(irc, client, channel, nick, '[hangman] ' + helps[cmd][0]);
	}
}

exports.init = function(api, stateIn, registerCommand) {
	state = stateIn;

	registerCommand('hangman', 'Play a game of hangman with me. !hangman help for full instructions.',
		function(irc, client, args, channel, nick) {

			// Let's figure out what we're doing
			if (args.length == 0) {

				utils.sendMessage(irc, client, channel, nick, '[hangman] You need to tell me what to do!');
				return;

			}

			var cmd = args.shift().toLowerCase();

			if (cmd == 'help') {

				outputHelp((args[0] ? args[0] : 'help'), 1, irc, client, channel, nick);

			} else if (cmd == 'start') {

				startGame(irc, client, args, channel, nick);

			} else if (channel) {

				// Get or initialise the game state for this channel
				loadGame(channel, function(error, game) {

					if (error) {
						utils.sendMessage(irc, client, channel, nick, '[hangman] Failed to get the game state, sorry. (' + error + ')');
						return;
					}

					if (!game.word) {

						utils.sendMessage(irc, client, channel, nick, '[hangman] There is no game running in this channel. Why not start one?');

					} else {

						if (cmd == 'show') {

							sendGameState(game, irc, client, channel);

						} else if (cmd == 'who') {

							irc.sendMessage(client, channel, '[hangman] The current game was started by ' + game.started_by + ', ' + game.started_at.toString().replace('T', ' ').replace('Z', '') + '.');

						} else if (cmd == 'guess') {

							game = guess(game, irc, client, args, channel, nick);

						} else if (cmd == 'reveal') {

							if (game.started_by == nick) {

								// Reveal the answer
								irc.sendMessage(client, channel, '[hangman] The answer was "' + game.word + '".');
								game = false;

							} else {

								var found = false;
								for (var i in game.revealvotes) {
									if (game.revealvotes[i] == nick) {
										found = true;
										break;
									}
								}
								if (found) {

									irc.sendMessage(client, channel, '[hangman] You\'ve already voted!');

								} else {

									game.revealvotes.push(nick);

									if (game.revealvotes.length >= 3) {

										// Got enough votes, reveal the answer
										irc.sendMessage(client, channel, '[hangman] That\'s enough votes... the answer was "' + game.word + '".');

										// Let's also send a PM to the user who started the game letting them know it's finished
										irc.sendPM(client, game.started_by, '[hangman] Your game in ' + channel + ' got enough votes to reveal the answer.');

										game = false;

									} else {

										irc.sendMessage(client, channel, '[hangman] That\'s ' + game.revealvotes.length + ' vote' + (game.revealvotes.length == 1 ? '' : 's') + '. I need 3 to reveal the answer.');

									}
								}

							}

						} else if (cmd == 'letters') {

							irc.sendMessage(client, channel, '[hangman] These have not yet been tried... ' + game.letters + '.');

						} else if (cmd == 'cancel') {

							if (game.started_by == nick) {

								irc.sendMessage(client, channel, '[hangman] Game cancelled :(. The answer was "' + game.word + '".');
								game = false;

							} else {

								irc.sendMessage(client, channel, '[hangman] Only ' + game.started_by + ' can cancel this game.', nick);

							}

						}

						if (game) {
							saveGame(channel, game, function(error) {
								if (error) {
									irc.sendMessage(client, channel, nick, '[hangman] Failed to save the game state, sorry. (' + error + ')');
								}
							});
						} else {
							deleteGame(channel, function(error) {
								if (error) {
									irc.sendMessage(client, channel, nick, '[hangman] Failed to delete the game state, sorry. (' + error + ')');
								}
							});
						}

					}

				});

			} else {

				// No channel, and not a start command
				utils.sendMessage(irc, client, channel, nick, '[hangman] Only the start command is valid in a PM.');

			}

		});
}

var sendGameState = function(game, irc, client, channel) {
	irc.sendMessage(client, channel, '[hangman] ' + game.state + ' - ' + game.guessesleft + ' guess' + (game.guessesleft == 1 ? '' : 'es') + ' left.');
}

var startGame = function(irc, client, args, channel, nick) {

	if (channel) {
		irc.sendMessage(client, channel, '[hangman] Dude, you rock! You just tried to start a game by broadcasting the answer to the channel. Try again, this time in a PM!', nick);
		return;
	}

	// No current game, check the other args.
	if (args.length == 0) {

		irc.sendPM(client, nick, '[hangman] Tell me more!');
		outputHelp('start', 1, irc, client, channel, nick);
		return;

	}

	// First thing is the word(s)
	var inWord = args.shift();
	if (inWord.substring(0, 1) == '"' || inWord.substring(0, 1) == "'") {
		// Multi-word, find the end
		while (args.length > 0 && inWord.substring(0, 1) != inWord.substring(inWord.length - 1)) {
			inWord += ' ' + args.shift();
		}
		// Should now have both opening and closing quotes, strip them
		inWord = inWord.substring(1, inWord.length - 1);
	}

	// Next we should have the channel
	if (args.length == 0) {

		irc.sendPM(client, nick, '[hangman] Need a channel!');
		outputHelp('start', 1, irc, client, channel, nick);
		return;

	}

	var inChannel = args.shift();
	if (inChannel.substring(0, 1) != '#') {

		irc.sendPM(client, nick, '[hangman] The channel must start with a #!');
		return;

	}

	var inGuesses = 12;
	if (args.length > 0) {

		inGuesses = args.shift().parseInt();
		if (inGuesses < 1) {

			irc.sendPM(client, nick, '[hangman] The number of guesses must be a positive integer!');
			return;

		}

	}

	// We're still here which means we have everything we need to start a game!

	// First get or initialise the game state
	loadGame(inChannel, function(error, game) {

		if (error) {
			irc.sendPM(client, nick, '[hangman] Failed to get the game state, sorry. (' + error + ')');
			return;
		}

		// Start a new game, but only if there's no current game in this channel
		if (game.word) {
			irc.sendPM(client, nick, '[hangman] There is already a game running in ' + inChannel + '. It was started by ' + game.started_by + ', ' + game.started_at.toString().replace('T', ' ').replace('Z', '') + '.');
			return;
		}

		// Stick the word in place
		game.word = inWord.toLowerCase();

		// Then set up the state which is a string with .'s representing chars
		// that haven't yet been guessed, and the letters that have in the right
		// places.
		game.state = '';
		for (var i = 0; i < game.word.length; i++) {
			var c = game.word.charAt(i);
			game.state += (c == ' ' ? ' ' : '.');
		}

		// The number of guesses left
		game.guessesleft = inGuesses;

		// The letters that haven't been guessed
		game.letters = 'abcdefghijklmnopqrstuvwxyz';

		// The reveal votes received
		game.revealvotes = [];

		// Who started it, and when
		game.started_by = nick;
		game.started_at = new Date();

		saveGame(inChannel, game, function(error) {

			if (error) {

				irc.sendPM(irc, client, nick, '[hangman] Failed to save the game state, sorry. (' + error + ')');

			} else {

				// All done! Tell the channel...
				irc.sendMessage(client, inChannel, '[hangman] ' + nick + ' has started a game of hangman in this channel. Send !hangman <guess> where <guess> is the letter, word or phrase to try.');
				sendGameState(game, irc, client, inChannel);

			    // And tell the user we've started it
				irc.sendPM(client, nick, '[hangman] Game successfully started in ' + inChannel);

			}

		});

	});
}

var guess = function(game, irc, client, args, channel, nick) {

	if (game.started_by == nick) {

		utils.sendMessage(irc, client, channel, nick, '[hangman] Why are you playing a game you started?!');
		return game;

	}

	if (args.length == 0) {

		utils.sendMessage(irc, client, channel, nick, '[hangman] Tell me more!');
		outputHelp('guess', 1, irc, client, channel, nick);
		return game;

	}

	var attempt = args.join(' ').toLowerCase();

	if (attempt.length == 1) {

		// Single letter. Is it in the word?
		if (game.letters.indexOf(attempt) == -1) {

			// Letter has already been guessed
			utils.sendMessage(irc, client, channel, nick, '[hangman] That letter has already been tried. Try one of these... ' + game.letters + '.');

		} else {

			// Remove the letter from the letters array
			game.letters = game.letters.replace(attempt, '');

			// Is it in the word?
			if (game.word.indexOf(attempt) == -1) {

				// Count this as a guess
				game.guessesleft--;

				// Nope
				utils.sendMessage(irc, client, channel, nick, '[hangman] Nope, there is no ' + attempt + ' - ' + game.guessesleft + ' guess' + (game.guessesleft == 1 ? '' : 'es') + ' left.');

				// Are we done yet?
				if (game.guessesleft <= 0) {

					// No guesses left
					utils.sendMessage(irc, client, channel, nick, '[hangman] You\'re all out of guesses! The answer was "' + game.word + '".');

					// Let's also send a PM to the user who started the game letting them know it's finished
					irc.sendPM(client, game.started_by, '[hangman] The users in ' + channel + ' ran out of guesses in your game. Congratulations.');

					// This return value will cause the game state to be deleted
					game = false;

				}

			} else {

				// Yup, it's in the word. Update the state...
				var old_state = game.state;
				game.state = '';
				for (var i = 0; i < game.word.length; i++) {

					if (game.word[i] == attempt) {

						game.state += attempt;

					} else {

						game.state += old_state[i];

					}

				}

				// Have we got the whole word?
				if (game.state == game.word) {

					// Correct guess
					irc.sendMessage(client, channel, '[hangman] Woohoo, you got the last letter ' + nick + '. The answer was ' + game.word + '!');

					// Let's also send a PM to the user who started the game letting them know it's finished
					irc.sendPM(client, game.started_by, '[hangman] Your game in ' + channel + ' has been won by ' + nick + '.');

					// This will cause the game state to be deleted
					game = false;

				} else {

					sendGameState(game, irc, client, channel);

				}

			}

		}

	} else {

		// Trying the guess the whole word

		if (attempt == game.word) {

			// Correct guess
			irc.sendMessage(client, channel, '[hangman] Woohoo, you got it right ' + nick + '. The answer was ' + attempt + '!');

			// Let's also send a PM to the user who started the game letting them know it's finished
			irc.sendPM(client, game.started_by, '[hangman] Your game in ' + channel + ' has been won by ' + nick + '.');

			// This will cause the game state to be deleted
			game = false;

		} else {

			// Incorrect guess
			utils.sendMessage(irc, client, channel, nick, '[hangman] Nope, it\'s not ' + attempt + ' - ' + game.guessesleft + ' guess' + (game.guessesleft == 1 ? '' : 'es') + ' left.');

			// Count this as a guess
			game.guessesleft--;

		}

	}

	return game;

}

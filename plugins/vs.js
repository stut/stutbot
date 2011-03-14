// The original PHP version of this plugin has the following notice...
// Kung Fu Dancing. Jared Earle, 2003.

var utils = require('../lib/utils');

exports.init = function(irc, config, state, registerCommand) {
	registerCommand('vs', 'Decide who would win a fight: !vs fighter_1 fighter_2', function(irc, client, args, channel, nick) {
		// Make sure we have 2 players
		if (args.length < 2) {
			utils.sendMessage(irc, client, channel, nick, 'It takes two entities to start a fight!');
			return;
		}

		// Pick a winner
		var winner = Math.floor(Math.random() * 1.99)
		var loser = (winner == 1 ? 0 : 1);
	
		var response = args[winner] + ' ';
		response += beats[Math.floor(Math.random() * beats.length)] + ' ';
		response += args[loser] + ' with ';
		response += styles[Math.floor(Math.random() * styles.length)] + ' ';
		response += animals[Math.floor(Math.random() * animals.length)] + ' ';
		response += arts[Math.floor(Math.random() * arts.length)] + '!';

		utils.sendMessage(irc, client, channel, nick, response);
	});
}

var beats = [
	'beats',
	'buries',
	'strikes down',
	'crushes',
];

var styles = [
	'Jumping',
	'Dancing',
	'Hidden',
	'Secret',
	'Crouching',
	'Shadow',
	'Silent',
	'Striking',
	'Masterful',
	'Drunken',
];

var animals = [
	'Monkey',
	'Snake',
	'Cat',
	'Sword',
	'Mantis',
	'Lotus',
	'Bamboo',
	'Tiger',
];

var arts = [
	'Kung Fu',
	'Kung Fu',
	'Kung Fu',
	'Ninjitsu',
	'Kung Fu',
];

// This plugin tracks the last time users were seen and the last thing they said

var utils = require('../lib/utils');
var state = null;

// Get the info for the given nick, callback(error, last_seen, last_msg)
var loadInfo = function(channel, nick, callback) {
	if (state) {
		state.get('seen', channel + '_' + nick, function(error, info) {
			if (error) {
				callback('[storeInfo] ' + error);
			} else {
				if (!info) {
					callback(null, null, null);
				} else {
					info = JSON.parse(info);
					callback(null, info.last_seen, info.last_msg);
				}
			}
		});
	} else {
		callback('[loadInfo] State not defined!');
	}
}

// Save the info for the given nick, callback(error)
var saveInfo = function(channel, nick, msg, callback) {
	if (state) {
		state.set('seen', channel + '_' + nick, JSON.stringify({ last_seen: new Date(), last_msg: msg }), function(error) {
			if (error) {
				callback(error);
			} else {
				callback(null);
			}
		});
	} else {
		callback('[saveInfo] State not defined!');
	}
}

exports.init = function(irc, configIn, stateIn, registerCommand) {
	state = stateIn;
	
	// Register a message listener which will take care of storing user activity
	irc.api.addListener('message', function(client, message, channel, nick) {
		saveInfo(channel, nick, message, function(error) {
			if (error) {
				// Not a lot we can do with an error here, so let's just dump it to the console for now
				console.log('[seen] ' + error);
			}
		});
	});
	
	// And watch user joins
    irc.api.addListener('userjoin', function(client, channel, nick) {
		saveInfo(channel, nick, 'User joined', function(error) {
			if (error) {
				// Not a lot we can do with an error here, so let's just dump it to the console for now
				console.log('[seen] ' + error);
			}
		});
    });

	// And user parts
    irc.api.addListener('userpart', function(client, channel, nick, message) {
		saveInfo(channel, nick, 'User parted: ' + (message ? message : 'No parting message'), function(error) {
			if (error) {
				// Not a lot we can do with an error here, so let's just dump it to the console for now
				console.log('[seen] ' + error);
			}
		});
    });

	registerCommand('seen', 'Find out when someone was last active and what they last said. !seen <nick>',
		function(irc, client, args, channel, nick) {

			// Let's figure out what we're doing
			if (args.length == 0) {

				utils.sendMessage(irc, client, channel, nick, '[hangman] You need to tell me what to do!');
				return;

			}
			
			loadInfo(channel, args[0], function(error, last_seen, last_msg) {
				if (error) {
					
					utils.sendMessage(irc, client, channel, nick, '[seen] ' + error);

				} else if (!last_seen) {

					utils.sendMessage(irc, client, channel, nick, '[seen] Never seen ' + args[0] + ' in this channel.');

				} else {

					utils.sendMessage(irc, client, channel, nick, '[seen] ' + args[0] + ' last seen: ' + last_seen.toString().replace('T', ' ').replace('Z', ''));
					utils.sendMessage(irc, client, channel, nick, '[seen] ' + args[0] + ' last said: ' + last_msg);

				}
			});

		});
}

var VERSION = '0.4';

var config = require('./config').config;
var state = require('./lib/state');
var utils = require('./lib/utils');

var sys = require('sys');
var fs = require('fs');
var path = require('path');
var Slack = require('slack-client');

var plugins = {};
var cmds = {};
var helps = {};
var slack = null;

var sortedKeys = function(obj) {
	var keys = [];
	for (var key in obj) {
		keys.push(key);
	}
	keys.sort();
	return keys;
}

var registerCommand = function(cmd, help, func) {
	cmds[cmd] = func;
	helps[cmd] = help;
}

var builtinLoader = function() {
	registerCommand(
		'version',
		'Displays Stutbot\'s version number',
		function(irc, client, args, channel, nick) {
			utils.sendMessage(irc, client, channel, nick, 'Stutbot v' + VERSION + ' at your service.');
		});

	registerCommand(
		'reload',
		'Forces a scan of the plugins folder to look for new and updated scripts.',
		function(irc, client, args, channel, nick) {
			pluginLoader(irc.api, 0, function(logmsg) {
				utils.sendMessage(irc, client, channel, nick, logmsg);
			});
		});

	registerCommand(
		'help',
		'Displays a list of registered commands and what they do.',
		function(irc, client, args, channel, nick) {
			if (args.length > 0) {
				if (helps[args[0]]) {
					utils.sendMessage(irc, client, channel, nick, helps[args[0]]);
				} else {
					utils.sendMessage(irc, client, channel, nick, 'No help available for "' + args.join(' ') + '"');
				}
			} else {
				var keys = sortedKeys(helps);
				for (var key in keys) {
					utils.sendMessage(irc, client, channel, nick, '!' + keys[key] + ' ' + helps[keys[key]]);
				}
			}
		});
}

var pluginLoader = function(slack, interval, log) {
	// var loaded = 0;
	// fs.readdir(config.plugin_folder, function (error, files) {
	// 	if (error) {
	// 		if (log) {
	// 			log('Failed to find plugins: ' + error);
	// 		}
	// 		console.log('Failed to find plugins: ' + error);
	// 	} else {
	// 		for (var x = 0, l = files.length; x < l; x++) {
	// 			var filename = config.plugin_folder + files[x];
	// 			var stats = fs.statSync(filename);
	// 			if (plugins[files[x]] != stats.mtime.toString()) {
	// 				var pluginName = files[x].split('.', 2)[0];
	// 				if (pluginName != 'unfuddle') {
	// 					if (log) {
	// 						log((plugins[files[x]] ? 'Reloading' : 'Loading') + ' ' + pluginName);
	// 					}
	// 					// Has the plugin been disabled in the config?
	// 					var conf = { enabled: true };
	// 					if (config.plugins && config.plugins[pluginName]) {
	// 						conf = config.plugins[pluginName];
	// 					}
	// 					if (conf.enabled == undefined || conf.enabled) {
	// 						// Initialise the plugin
	// 						require(filename).init(irc, conf, state, registerCommand);
	// 						plugins[files[x]] = stats.mtime.toString();
	// 						loaded++;
	// 					} else if (log) {
	// 						log('Not loading disabled plugin ' + pluginName);
	// 					}
	// 				}
	// 			}
	// 		}
	// 		if (interval > 0) {
	// 			setTimeout(function() {
	// 				pluginLoader(irc, interval);
	// 			}, interval * 1000);
	// 		}
	// 	}

	// 	if (loaded == 0 && log) {
	// 		log('No new or updated plugins found');
	// 	}
	// });
}

// Initialise the state module
state.init(config.state_db, function(error) {
	if (error) {
		console.log(error);
	} else {
		// Initialise the plugins
		// Start the bot
		var slack = new Slack(config.slack.key, true, true);

		builtinLoader();
		pluginLoader(slack, config.plugin_check_interval);

		slack.on('open', function() {
			var key;
			for (key in slack.channels) {
				if (slack.channels[key].is_member) {
					if (config.slack.channels.indexOf('#' + slack.channels[key].name) == -1) {
						// We shouldn't be in this channel!
						console.log('Leaving channel ' + '#' + slack.channels[key].name)
						slack.channels[key].leave()
					}
				} else {
					if (config.slack.channels.indexOf('#' + slack.channels[key].name) > -1) {
						// Should be in this channel!
						console.log('Joining channel ' + '#' + slack.channels[key].name)
						slack.joinChannel('#' + slack.channels[key].name)
					}
				}
			}

			console.log('Welcome to Slack. You are @%s of %s', slack.self.name, slack.team.name);
		});


		slack.on('message', function(message) {

			var type = message.type,
			    subtype = message.subtype,
			    channel = slack.getChannelGroupOrDMByID(message.channel),
			    user = slack.getUserByID(message.user),
			    time = message.ts,
			    text = message.text;

			console.log('Received: %s %s @%s %s "%s"', type, (channel.is_channel ? '#' : '') + channel.name, user.name, time, text);

			// Respond to messages with the reverse of the text received.

			if (type === 'message') {
				if (subtype == undefined) {
					if (text[0] == '!') {
						// Extract the command and arguments
						bits = text.substring(1).split(' ');
						cmd = bits.shift();
						args = [];
						while (bits.length > 0) {
							var bit = bits.shift();
							if (bit.length > 0) {
								args.push(bit);
							}
						}

						if (cmds[cmd]) {
							// Run the command
							cmds[cmd](slack, args, channel, user);
						} else {
							// Not recognised
							channel.send('Sorry, but I don\'t know how to ' + cmd);
						}
					}
				} else {
					console.log('Unhandled message subtype [' + subtype + '] to [' + channel.name + '] saying [' + text + ']')
				}
			} else {
				console.log('Unhandled type [' + type + '.' + subtype + '] to [' + channel.name + '] saying [' + text + ']')
			}
		});

		slack.on('error', function(error) {
			console.error('Error: %s', error);
		});

		slack.login();

		// irc.api.addListener('pm', function(client, message, nick) {
		// 	if (message[0] == '!') {
		// 		message = message.substring(1);
		// 	}

		// 	// Extract the command and arguments
		// 	bits = message.split(' ');
		// 	cmd = bits.shift();
		// 	args = [];
		// 	while (bits.length > 0) {
		// 		var bit = bits.shift();
		// 		if (bit.length > 0) {
		// 			args.push(bit);
		// 		}
		// 	}

		// 	if (cmds[cmd]) {
		// 		// Run the command
		// 		cmds[cmd](irc, client, args, null, nick);
		// 	} else {
		// 		// Not recognised
		// 		irc.sendPM(client, nick, 'Sorry, but I don\'t know how to ' + cmd);
		// 	}
		// });
	}
});

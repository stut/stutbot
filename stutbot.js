var VERSION = '0.2';

var config = require('./config').config;
var state = require('./lib/state');
var utils = require('./lib/utils');

var sys = require('sys');
var fs = require('fs');
var path = require('path');

var plugins = {};
var cmds = {};
var helps = {};
var irc = null;

// Initialise the state module
state.init(config.state_db, function(error) {
	if (error) {
		console.log(error);
	} else {
		// Initialise the plugins
		// Start the bot
		irc = require('./lib/irc');

		builtinLoader();
		pluginLoader(irc, config.plugin_check_interval);

		irc.api.addListener('connect', function(client) {
			// Connected to server, send any on_connect commands that are configured
			if (config.oper) {
				irc.send(client, 'oper', config.oper.user, config.oper.pass);
			}
		});

		irc.api.addListener('message', function(client, message, channel, nick) {
			if (message[0] == '!') {
				// Extract the command and arguments
				bits = message.substring(1).split(' ');
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
					cmds[cmd](irc, client, args, channel, nick);
				} else {
					// Not recognised
					irc.sendMessage(client, channel, 'Sorry, but I don\'t know how to ' + cmd, nick);
				}
			}
		});

		irc.api.addListener('pm', function(client, message, nick) {
			if (message[0] == '!') {
				message = message.substring(1);
			}

			// Extract the command and arguments
			bits = message.split(' ');
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
				cmds[cmd](irc, client, args, null, nick);
			} else {
				// Not recognised
				irc.sendPM(client, nick, 'Sorry, but I don\'t know how to ' + cmd);
			}
		});
	}
});

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
			pluginLoader(api, 0, function(logmsg) {
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

var pluginLoader = function(irc, interval, log) {
	var loaded = 0;
	fs.readdir(config.plugin_folder, function (error, files) {
		if (error) {
			if (log) {
				log('Failed to find plugins: ' + error);
			}
			console.log('Failed to find plugins: ' + error);
		} else {
			for (var x = 0, l = files.length; x < l; x++) {
				var filename = config.plugin_folder + files[x];
				var stats = fs.statSync(filename);
				if (plugins[files[x]] != stats.mtime.toString()) {
					if (log) {
						log((plugins[files[x]] ? 'Reloading' : 'Loading') + ' ' + files[x].split('.', 2)[0]);
					}
					// Initialise the plugin
					require(filename).init(irc, state, registerCommand);
					plugins[files[x]] = stats.mtime.toString();
					loaded++;
				}
			}
			if (interval > 0) {
				setTimeout(function() {
					pluginLoader(api, interval);
				}, interval * 1000);
			}
		}

		if (loaded == 0 && log) {
			log('No new or updated plugins found');
		}
	});
}

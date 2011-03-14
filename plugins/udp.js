/*
	This plugin binds to a UDP socket and posts received messages to the
	configured channel.

	The configuration section is an array since this plugin has the ability
	to monitor several URLs.

	udp: [{
		ip: '0.0.0.0',
		port: 32198,
		channel: '#dev',
		prefix: '[udp] ',
	}]
*/

var utils = require('../lib/utils.js'),
	dgram = require('dgram');

var runServer = function(config, irc) {

	try {

	    var server = dgram.createSocket('udp4');

	    server.on('message', function (msg, rinfo) {
			utils.sendMessage(irc, irc.clients[0], config.channel, null, (config.prefix ? config.prefix : '') + msg);
	    });

	    server.bind(config.port, config.ip);
	
	} catch (error) {

		console.log('[udp] Exception: ' + error);
		
		// Restart it
		runServer(config, irc);

	}

}

exports.init = function(irc, config, state, registerCommand) {

	for (var i in config) {

		runServer(config[i], irc);

	}

}

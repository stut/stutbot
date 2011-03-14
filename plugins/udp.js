var utils = require('../lib/utils.js'),
	dgram = require('dgram');

var runServer = function(config, irc) {

    var server = dgram.createSocket('udp4');

    server.on('message', function (msg, rinfo) {
		utils.sendMessage(irc, irc.clients[0], config.channel, null, config.prefix + msg);
    });

    server.bind(config.port, config.ip);

}

exports.init = function(irc, config, state, registerCommand) {

	for (var i in config.servers) {

		runServer(config.servers[i], irc);

	}

}

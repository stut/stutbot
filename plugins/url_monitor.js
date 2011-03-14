/*
	This plugin serves a particular purpose for one of my clients. They have
	a script that can be hit to get recent logging from the server. The script
	clears the log whenever it is retrieved so this plugin does not need to
	remember what it has already seen making it very simple.
	
	The configuration section is an array since this plugin has the ability
	to monitor several URLs.
	
	url_monitor: [{
		// Check the URL every 10 seconds
		interval: 10,
		// Post to this channel
		channel: '#channel',
		// Prefix messages with this text
		prefix: '[url] ',
		// The URL to fetch
		url: 'http://www.example.com/get_the_log.php',
	}],
*/
var utils = require('../lib/utils'),
	http = require('http'),
	url = require('url');

var irc = null;

var outputLines = function(config, str) {
	var lines = str.split("\n");
	for (var i in lines) {
		if (lines[i].length > 0) {
			utils.sendMessage(irc, irc.clients[0], config.channel, null, (config.prefix ? config.prefix : '') + lines[i]);
		}
	}
}
var fetchURL = function(config) {

	try {

		var urlbits = url.parse(config.url);

		options = {
			host: urlbits.host,
			port: (urlbits.port ? urlbits.port : 80),
			path: urlbits.pathname + (urlbits.search ? urlbits.search : ''),
			method: 'GET',
		};

		var req = http.request(options, function(res) {
			if (res.statusCode != 200) {
				utils.sendMessage(irc, irc.clients[0], config.channel, null, '[url_monitor] Request failed [' + res.statusCode + ']');
			} else {
				var response = '';
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					response += chunk;
					var idx = chunk.lastIndexOf("\n");
					if (idx != -1) {
						outputLines(config, response.substring(0, idx));
						response = response.substring(idx + 1);
					}
				});
				res.on('end', function () {
					outputLines(config, response);
				});
			}
		});

		req.setHeader('Accept', '*/*');
		req.end();
		
	} catch (error) {

		utils.sendMessage(irc, irc.clients[0], config.channel, null, '[url_monitor] Exception: ' + error);

	}
	
	setTimeout(function() { fetchURL(config); }, config.interval * 1000);

}

exports.init = function(ircIn, configIn, stateIn, registerCommand) {
	
	irc = ircIn;
	config = configIn;

	for (var i in config) {
		// Kick off checking the URL
		setTimeout(function() { fetchURL(config[i]); }, config[i].interval * 1000);
	}

}

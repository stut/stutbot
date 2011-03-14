var utils = require('../lib/utils'),
	http = require('http'),
	https = require('https'),
	url = require('url');

var fetchHTMLTitle = function(u, callback, get_it) {

	var urlbits = url.parse(u);

	options = {
		host: urlbits.host,
		port: (urlbits.port ? urlbits.port : (urlbits.protocol.substring(0, 5) == 'https' ? 443 : 80)),
		path: urlbits.pathname,
		method: (get_it ? 'GET' : 'HEAD'),
	};

	var cls = (options.port == 443 ? https : http);
	
	var req = cls.request(options, function(res) {
		if (res.statusCode == 301 || res.statusCode == 302) {
			// Follow the redirection
			fetchHTMLTitle(res.headers.location, function(error, u, t) { callback(error, u, t); });
		} else if (res.statusCode != 200) {
			callback('Request failed [' + res.statusCode + ']', u);
		} else {
			if (options.method == 'HEAD') {
				if (res.headers['content-type'].substring(0, 9) == 'text/html') {
					// Content-type is acceptable, fetch again but this time with a GET
					fetchHTMLTitle(u, function(error, u, t) { callback(error, u, t); }, 1);
				}
			} else {
				var response = '';
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					response += chunk;
					var m = response.match(/<title>(.+?)<\/title>/i);
					if (m) {
						callback(null, u, m[0].substring(7, m[0].length - 8));
						response = '';
					}
				});
			}
		}
	});

	req.setHeader('Accept', '*/*');
	req.end();

}

exports.init = function(irc, configIn, stateIn, registerCommand) {
	irc.api.addListener('message', function(client, message, channel, nick) {
		if (message.indexOf('http') != -1) {
			bits = message.split(' ');
			for (var i in bits) {
				if (bits[i].substring(0, 7) == 'http://' || bits[i].substring(0, 8) == 'https://') {
					fetchHTMLTitle(bits[i], function(error, u, t) {
						if (error) {
							utils.sendMessage(irc, client, channel, (channel ? null : nick), 'Failed to get title: ' + error + ' < ' + u + ' >');
						} else {
							utils.sendMessage(irc, client, channel, (channel ? null : nick), '"' + t + '" < ' + u + ' >');
						}
					});
				}
			}
		}
	});
};

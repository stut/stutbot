var http = require('http'),
	https = require('https'),
	config = require('../config.js').plugins.unfuddle;

var auth = new Buffer(config.user + ':' + config.pass, 'utf8').toString('base64');

var doAPI = function(u, data, callback) {
	options = {
		host: config.account + '.unfuddle.com',
		port: 443,
		path: '/api/v1/' + u + '.json',
		method: (data ? 'POST' : 'GET'),
	};

	var req = https.request(options, function(res) {
		if (res.statusCode != 200) {
			callback('Request failed [' + res.statusCode + ']');
		} else {
			var retval = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				retval += chunk;
			});
			res.on('end', function() {
				callback(null, JSON.parse(retval));
			});
		}
	});

	req.setHeader('Accept', 'application/json');
	req.setHeader('Authorization', 'Basic ' + auth);

	// Write data to request body
	if (data) {
		req.setHeader('Content-Type', 'application/json');
		req.setHeader('Content-Length', data.length.toString());
		req.write(data);
	}

	// End the request
	req.end();
}

var project = null;
var repo = null;

exports.init = function(api, state, registerCommand) {

	// Get the project and repository
	doAPI('projects/by_short_name/' + config.project, null, function(error, p) {
		if (error) {
			console.log(error);
		} else {
			project = p;

			doAPI('repositories', null, function(error, repositories) {
				if (error) {
					console.log(error);
				} else {
					for (var i in repositories) {
						if (repositories[i].abbreviation == config.repo) {
							repo = repositories[i];
							break;
						}
					}
					
					// Repo callback functionality
					if (config.callback_host) {
						
						// Set up an HTTP server to receive callbacks and point the repo callback URL at it
						
						http.createServer(function (req, res) {

							// Would do something sensible with the callback data here
							res.writeHead(200, {'Content-Type': 'text/plain'});
							res.end('Thanks!');

						}).listen(config.callback_port, '0.0.0.0');

						// Update the callback URL
						doAPI('repositories/' + repo.id, JSON.stringify({ callback_url: 'http://' + config.callback_host + ':' + config.callback_port + '/' }), function(error, response) {
							if (error) {
								console.log(error);
							} else {
								// Register the command
								registerCommand('unfuddle', 'Interrogate the Unfuddle API', function(irc, client, args, channel, nick) {
									doAPI('repositories', null, function(error, repositories) {
										if (error) {
											console.log(error);
										} else {
											console.log(repositories);
											irc.sendMessage(client, channel, repositories, nick);
										}
									});
							}
						});

					}

/*
					doAPI('projects/' + project.id + '/activity?start-date=2011/03/11', null, function(error, activity) {
						if (error) {
							console.log(error);
						} else {
							activity.reverse();
							for (var i in activity) {
								irc.sendMessage(client, channel, activity[i].event + ': ' + activity[i].description, nick);
							}
						}
					});
*/
				}
			});
		}
	});
}

exports.config = {
	state_db: './stutbot.db',
	plugin_folder: './plugins/',
	plugin_check_interval: 3600,
	//oper: {
	//	user: 'frank',
	//	pass: 'grabthar\'s hammer',
	//},
	plugins: { },
};

exports.plugins = {
	unfuddle: {
		account: 'account',
		user: 'username',
		pass: 'password',
		project: 'myproject',
		repo: 'repository',
		// The following options enable the repo callback function
		// Host can be a hostname or IP
		//callback_host: '1.2.3.4',
		//callback_port: 8765,
	},
};

exports.profiles = [{
	host: "irc.server.com",
	port: 6667,
	nick: 'stutbot',
	password: null,
	user: 'stutbot',
	real: 'Stutbot',
	channels: ["#stutbot-test"],
}];

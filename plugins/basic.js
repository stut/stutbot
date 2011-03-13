exports.init = function(api, state, registerCommand) {
	// Eight ball
	registerCommand('8', 'Magic 8-ball. Ask it a question!', function(irc, client, args, channel, nick) {
		irc.sendMessage(client, channel, eightball_responses[Math.floor(Math.random()*eightball_responses.length)], nick);
	});

	registerCommand('now', 'Tells you what the current date and time are.', function(irc, client, args, channel, nick) {
		var current = new Date();
		var day = current.getDate();
		var month = current.getMonth();
		var year = current.getFullYear();
		var hours = current.getHours();
		var minutes = current.getMinutes();
		if (minutes < 10) minutes = "0" + minutes;
		irc.sendMessage(client, channel, year + '-' + month + '-' + day + ' ' + hours + ':' + minutes, nick);
	});
}

var eightball_responses = [
	'Signs point to yes.',
	'Yes.',
	'Reply hazy, try again.',
	'Without a doubt.',
	'My sources say no.',
	'As I see it, yes.',
	'You may rely on it.',
	'Concentrate and ask again.',
	'Outlook not so good.',
	'It is decidedly so.',
	'Better not tell you now.',
	'Very doubtful.',
	'Yes - definitely.',
	'It is certain.',
	'Cannot predict now.',
	'Most likely.',
	'Ask again later.',
	'My reply is no.',
	'Outlook good.',
	'Don\'t count on it.',
	'Yes, in due time.',
	'My sources say no.',
	'Definitely not.',
	'Yes.',
	'You will have to wait.',
	'I have my doubts.',
	'Outlook so so.',
	'Looks good to me!',
	'Who knows?',
	'Looking good!',
	'Probably.',
	'Are you kidding?',
	'Go for it!',
	'Don\'t bet on it.',
	'Forget about it.',
];

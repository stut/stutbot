// Send a message to the channel, or the nick if the channel is null
exports.sendMessage = function(irc, client, channel, nick, message) {
	if (channel) {
		irc.sendMessage(client, channel, message, nick);
	} else {
		irc.sendPM(client, nick, message);
	}
}

var express = require('express');
var twitter = require('ntwitter');
var sentiment = require('sentiment');
var socket = require('socket.io');

var app = express();

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(app.router);
app.use(express.static('public'));
app.use(express.errorHandler());

var active_connections = 0;
io.sockets.on('connection', function (socket) {
	active_connections++;

	socket.emit('users', active_connections);

	socket.on('disconnect', function () {
	    active_connections--;
	    io.sockets.emit('users', active_connections);
	});
});

function emitTweet(raw_tweet) {
	var parsed_tweet = {};
  	parsed_tweet.text = raw_tweet.text;
  	parsed_tweet.username = raw_tweet.user.name;
  	parsed_tweet.userimage = raw_tweet.user.profile_image_url;

  	io.sockets.emit('tweet', parsed_tweet);
}

function emitSentiment(text) {
	sentiment(text, function (err, result) {
		if(err) { console.log("getSentiment: " + err); break; }

	    console.dir(result);
	    io.sockets.emit('sentiment', result.score);
	});
}

// Stream the tweets from Twitter
var twit = new twitter({
  consumer_key: 'Pguipl77AL93yAwEl2g',
  consumer_secret: 'TibApHZ3OKBTAi3slqszUnUau7KbXIdN0k7uLdsY',
  access_token_key: '235895289-Kgua0YwUCmXyZiBFtZnpER1kzo9stznuznEoMGuM',
  access_token_secret: 'REe0AQ7WDIdnrdxK2yUIbRcamUc0yxjnpTtDDxbn4'
});

twit.stream('statuses/filter', {'track': 'iPhone 5c'}, function(stream) {
  stream.on('data', function (raw_tweet) { 	
  	emitTweet(raw_tweet);
	emitSentiment(raw_tweet.text);
  });

  stream.on('end', function (response) {
    console.log("Connection ended");
    // Handle a disconnection
  });
  
  stream.on('destroy', function (response) {
  	console.log("Connection silently ended");
    // Handle a 'silent' disconnection from Twitter, no end/error event fired
  });

});

//Start the servers
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("App listening on " + port);
});
var io = socket.listen(port, function() {
  console.log("Socket.io listening on " + port);
})
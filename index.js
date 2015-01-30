var App = function () {
	var Server = require('./app/Server.js').Server,
		Routes = require('./app/Routes.js'),
		Alarm = require('./app/Alarm.js'),
		async = require('async'),
		settings = require('./package.json'),
		self = this;

	// Create the new server instance
	this.server = new Server(this, settings);
	this.routes = new Routes(this, this.server);
	this.alarm = new Alarm(this);

	// Start the server listener
	this.server.start();

	// Startup complete
	self.log('*App* : Startup complete');
};

App.prototype.log = function () {
	var dt = new Date(),
		msg = dt.toDateString() + ' ' + dt.toTimeString().substr(0, 8) + ': ' + arguments[0],
		finalArgs = [msg],
		i;

	for (i = 1; i < arguments.length; i++) {
		finalArgs.push(arguments[i]);
	}

	console.log.apply(this, finalArgs);
};

App.prototype.exit = function () {
	setTimeout(function () {
		process.exit();
	}, 200);
};

// Register exit process
process.on('SIGINT', function() {
	process.exit();
});

var app = new App();
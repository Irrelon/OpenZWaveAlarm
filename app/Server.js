var Server = function (app, settings) {
	this._app = app;
	this._version = '1.0';
	this._http = require('http');
	this._https = require('https');
	this._fs = require('fs');
	this._express = require('express');
	this._settings = settings;

	this.router = this._express();

	var self = this;

	this.router.use(this._express.json());
	this.router.use(this._express.urlencoded());

	if (this._settings.ssl && this._settings.ssl.enable) {
		this._ssl = {
			key: this._fs.readFileSync(this._settings.ssl.key),
			cert: this._fs.readFileSync(this._settings.ssl.cert)
		}
	}

	self._app.log('*Server* : Init, ssl: ' + this._settings.ssl.enable);
};

Server.prototype.start = function () {
	var self = this;

	if (this._settings.ssl && this._settings.ssl.enable) {
		this._afServer = this._https.createServer(this._ssl, this.router);
	} else {
		this._afServer = this._http.createServer(this.router);
	}

	self._app.log('*Server* : Creating listener on port: ' + this._settings.server.apiFacing.port);
	this._afServer.listen(this._settings.server.apiFacing.port, this._settings.server.apiFacing.host);

	self._app.log('*Server* : Start');
};

module.exports.Server = Server;

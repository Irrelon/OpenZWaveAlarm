var Alarm = function (app) {
	var self = this;

	self._app = app;
	self._armed = false;
	self._failCount = 0;
};

Alarm.prototype.armed = function (val) {
	if (val !== undefined) {
		this._armed = val;
		return this;
	}

	return this._armed;
};

Alarm.prototype.failCount = function (val) {
	if (val !== undefined) {
		this._failCount = val;
		return this;
	}

	return this._failCount;
};

Alarm.prototype.enterState = function (state, callback) {

};

module.exports = Alarm;
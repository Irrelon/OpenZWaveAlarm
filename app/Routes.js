var Routes = function (app, server) {
	var self = this,
		router = server.router;

	self._app = app;

	router.get('/v1.0/alarm/armed', self.getArmed);
	router.put('/v1.0/alarm/armed', self.setArmed);
};

Routes.prototype.getArmed = function (req, res) {
	var self = this;

	res.send({
		"armed": self._app.alarm.state()
	});
	return;
};

Routes.prototype.setArmed = function (req, res) {
	var self = this,
		auth;

	auth = req.body.auth;

	if (auth && auth.code) {
		// Check for correct auth data
		if (auth.code === '1234') {
			// Code is correct

			// Reset fail count
			self._app.alarm.failCount(0);

			// Tell the alarm to enter the armed state
			self._app.alarm.enterState('armed', function (err) {
				if (!err) {
					res.send({
						"armed": self._app.alarm.state()
					});
					return;
				} else {
					res.send({
						"armed": self._app.alarm.state(),
						"err": err
					});
					return;
				}
			});
		} else {
			// Code is incorrect
			// Add to the fail count
			self._app.alarm.failCount(self._app.alarm.failCount() + 1);

			res.send({
				"armed": self._app.alarm.state(),
				"err": "Auth failed"
			});
			return;
		}
	} else {
		res.send({
			"err": "Missing auth || auth.code in request body!"
		});
		return;
	}
};

module.exports = Routes;
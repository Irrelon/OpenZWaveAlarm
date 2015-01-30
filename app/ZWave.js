var OZW = require('openzwave');

var ZWave = function (app) {
	var self = this;

	self._app = app;
	self.nodes = [];

	self.zwave = new OZW('/dev/ttyUSB0', {
		logging: false,			// enable logging to OZW_Log.txt
		consoleoutput: false,	// copy logging to the console
		saveconfig: false,		// write an XML network layout
		driverattempts: 3,		// try this many times before giving up
		pollinterval: 500,		// interval between polls in milliseconds
		suppressrefresh: true	// do not send updates if nothing changed
	});

	self.registerListeners();
};

ZWave.prototype.connect = function () {
	self._app.log('*ZWave* : Connecting...');
	self.zwave.connect();
};

ZWave.prototype.disconnect = function () {
	self._app.log('*ZWave* : Disconnecting...');
	self.zwave.disconnect();
};

ZWave.prototype.registerListeners = function () {
	var self = this,
		comClass,
		i;

	self._app.log('*ZWave* : Registering listeners...');

	self.zwave.on('driver ready', function (homeid) {
		self._app.log('*ZWave* : Driver started with home id: ' + homeid.toString(16));
	});

	self.zwave.on('driver failed', function () {
		self._app.log('*ZWave* : Failed to start driver!');
		self.zwave.disconnect();
		process.exit();
	});

	self.zwave.on('node added', function (nodeid) {
		self.nodes[nodeid] = {
			manufacturer: '',
			manufacturerid: '',
			product: '',
			producttype: '',
			productid: '',
			type: '',
			name: '',
			loc: '',
			classes: {},
			ready: false,
		};
	});

	self.zwave.on('value added', function (nodeid, comClass, value) {
		if (!self.nodes[nodeid]['classes'][comClass]) {
			self.nodes[nodeid]['classes'][comClass] = {};
		}

		self.nodes[nodeid]['classes'][comClass][value.index] = value;
	});

	self.zwave.on('value changed', function (nodeid, comClass, value) {
		if (self.nodes[nodeid]['ready']) {
			self._app.log('*ZWave* : Node %d changed state %d:%s:%s->%s',
				nodeid,
				comClass,
				value['label'],
				self.nodes[nodeid]['classes'][comClass][value.index]['value'],
				value['value']
			);
		}

		self.nodes[nodeid]['classes'][comClass][value.index] = value;
	});

	self.zwave.on('value removed', function (nodeid, comClass, index) {
		if (self.nodes[nodeid]['classes'][comClass] &&
			self.nodes[nodeid]['classes'][comClass][index]) {
			delete self.nodes[nodeid]['classes'][comClass][index];
		}
	});

	self.zwave.on('node ready', function (nodeid, nodeinfo) {
		self.nodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
		self.nodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
		self.nodes[nodeid]['product'] = nodeinfo.product;
		self.nodes[nodeid]['producttype'] = nodeinfo.producttype;
		self.nodes[nodeid]['productid'] = nodeinfo.productid;
		self.nodes[nodeid]['type'] = nodeinfo.type;
		self.nodes[nodeid]['name'] = nodeinfo.name;
		self.nodes[nodeid]['loc'] = nodeinfo.loc;
		self.nodes[nodeid]['ready'] = true;

		self._app.log('*ZWave* : Node ready %d: %s, %s', nodeid,
			nodeinfo.manufacturer ? nodeinfo.manufacturer
				: 'id=' + nodeinfo.manufacturerid,
			nodeinfo.product ? nodeinfo.product
				: 'product=' + nodeinfo.productid +
			', type=' + nodeinfo.producttype);

		self._app.log('*ZWave* : Node ready %d name="%s", type="%s", location="%s"', nodeid,
			nodeinfo.name,
			nodeinfo.type,
			nodeinfo.loc);

		for (comClass in self.nodes[nodeid]['classes']) {
			if (self.nodes[nodeid]['classes'].hasOwnProperty(comClass)) {
				switch (comClass) {
					case 0x25: // COMMAND_CLASS_SWITCH_BINARY
					case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
						self.zwave.enablePoll(nodeid, comClass);
						break;
				}

				var values = self.nodes[nodeid]['classes'][comClass];
				self._app.log('*ZWave* : Node %d class %d', nodeid, comClass);

				for (i in values) {
					self._app.log('*ZWave* : Node %d %s=%s', nodeid, values[i]['label'], values[i]['value']);
				}
			}
		}
	});

	self.zwave.on('notification', function (nodeid, notif) {
		switch (notif) {
			case 0:
				self._app.log('*ZWave* : Node %d message complete', nodeid);
				break;

			case 1:
				self._app.log('*ZWave* : Node %d timeout', nodeid);
				break;

			case 2:
				self._app.log('*ZWave* : Node %d nop', nodeid);
				break;

			case 3:
				self._app.log('*ZWave* : Node %d node awake', nodeid);
				break;

			case 4:
				self._app.log('*ZWave* : Node %d node sleep', nodeid);
				break;

			case 5:
				self._app.log('*ZWave* : Node %d node dead', nodeid);
				break;

			case 6:
				self._app.log('*ZWave* : Node %d node alive', nodeid);
				break;
		}
	});

	self.zwave.on('scan complete', function () {
		self._app.log('*ZWave* : Scan complete, hit ^C to finish');
	});
};
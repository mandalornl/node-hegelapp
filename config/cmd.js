module.exports = {
	power: {
		on: '-p.1',
		off: '-p.0',
		toggle: '-p.t',
		status: '-p.?'
	},

	mute: {
		on: '-m.1',
		off: '-m.0',
		toggle: '-m.t',
		status: '-m.?'
	},

	volume: {
		up: '-v.u',
		down: '-v.d',
		set: '-v.<int>',
		status: '-v.?'
	},

	input: {
		set: '-i.<int>',
		status: '-i.?'
	},

	reset: {
		set: '-r.<int>',
		stop: '-r.~',
		status: '-r.?'
	}
};

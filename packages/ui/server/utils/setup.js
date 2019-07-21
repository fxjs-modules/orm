const commonOptions = exports.commonOptions = {
	burnout_timeout: -500,
	hooks: {
		'nirvana:mchanged' ({ info }) {
			console.log('[common]mchanged', info)
		}
	}
};
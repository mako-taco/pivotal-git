var check = require('./internal/check'),
	readline = require('readline'),
	pivotal = require('pivotal');

module.exports = function (args) {
	check(function (err, pt) {
		if(err) {
			throw err;
		}

		pivotal.useToken(pt.apikey);
		pivotal.getStories(pt.project, {limit: 5}, function (err, stories) {
			stories.forEach(function (story) {
				
			});
		});
	});
}
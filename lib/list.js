var check = require('./internal/check'),
	colors = require('colors'),
	git = require('./internal/git');

module.exports = function (args) {
	check(function (err, pt) {
		if(err) {
			throw err;
		}

		git.getConfigStore(function (err, store) {
			if(err) {
				throw err;
			}
			else if(store.active.length === 0) {
				console.log("no active stories!".cyan)
			}
			else {
				store.active.forEach(function (active) {
					console.log((active.story.name + ": " + active.git.branch).cyan);
				});
			}
		});
	});
}

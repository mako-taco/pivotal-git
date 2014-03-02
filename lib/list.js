var check = require('./internal/check'),
	colors = require('colors'),
	git = require('./internal/git');

module.exports = function (args) {
	check(function (err, pt) {
		if(err) {
			throw err;
		}

		git.getBranch(function (err, branch) {
			if(err) {
				throw err;
			}

			var currentBranch = branch;

			git.getConfigStore(function (err, store) {
				if(err) {
					throw err;
				}
				var storeArray = [];
				for(var key in store) {
					storeArray.push({
						branch: key,
						story: store[key]
					});
				}

				if(storeArray.length === 0) {
					console.log("no active stories!".cyan)
				}
				else {
					storeArray.forEach(function (active) {
						if(active.branch == currentBranch) {
							console.log(active.branch.green + " " + active.story.name.grey);
						}
						else {
							console.log(active.branch.cyan + " " + active.story.name.grey);
						}
					});
				}
			});
		});
	});
}

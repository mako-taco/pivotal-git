var check = require('./internal/check'),
	git = require('./internal/git'),
	ask = require('./internal/ask'),
	readline = require('readline'),
	colors = require('colors'),
	pivotal = require('pivotal')

	//adding some stuff on to this shitty library, replacing broken functonality
	pivotal.me = require('./internal/pivotal-shim').me,
	pivotal.updateStory = require('./internal/pivotal-shim').updateStory,
	pivotal.getStories = require('./internal/pivotal-shim').getStories;

module.exports = function (args) {
	git.getConfigStore(function (err, store) {
		if(err) {
			throw err;
		}

		var possibilities = [];
		for(var branch in store) {
			if(branch.toLowerCase().indexOf(args[0].toLowerCase() > -1) {
				possibilities.push(branch);
			}
		}

		if(possibilities.length == 0) {
			console.error(("No branches matched " + args[0]).red);
			process.exit(1);
		}
		else if(possibilities.length == 1) {
			git.checkout(branch, function (err) {
				if(err) {
					console.error(("Could not check out " + branch + ": " + err.message).red);
					process.exit(1);
				}

				process.exit(0);
			})
		}
		else {
			console.log(("Multiple branches matched " + args[0]).cyan);
			for (var i in possibilities) {
				console.log((possibilities[i]).cyan);
			}
			process.exit(1);	
		}
	});
}
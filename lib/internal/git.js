var	exec = require('child_process').exec;

var RE_ASTERISK_BRANCH = /\*\s+(.*?)\n/,
	RE_STATUS_CODE = /(..)\s+(.*?)\n/,
	RE_STATUS_BRANCH = /\#\#\s+(.*?)\n/;

var git = {
	/* Get the current branch name */
	getBranch: function (callback) {
		exec('git branch --color=never', function (err, stdout, stderr) {
			if(err) {
				callback(err);
			}
			else {
				var result = RE_ASTERISK_BRANCH.exec(stdout.toString());
				if(!result) {
					console.log(stdout.toString());
					callback(new Error("Could not find active branch name"));
				}
				else {
					callback(null, result[1])
				}
			}
		});
	},
	
	/* Calls back with an object that contains 'branch' and 'clean'
	 * @callback(err, results)
	 *   @results {object}
	 *	   @branch {string} the name of the branch
	 *     @clean {boolean} clean if there are no changes to the repo */
	status: function (callback) {
		var results = {};
		exec('git status --branch --porcelain', function (err, stdout, stderr) {
			if(err) {
				callback(err)
			}

			var lines = stdout.toString().split('\n');
			results.branch = RE_STATUS_BRANCH.exec(lines[0])[1];
			results.clean = true;
			for(var i=1; i<lines.length; i++) {
				var code = RE_STATUS_CODE.exec(lines[i])[1];
				if(code == '??') {
					continue;
				}
				else if(code.charAt(0) != ' ') {
					results.clean = false;;
					break;
				}
			}

			callback(null, results);
		})
	},

	/* pulls from origin, will abort on merge */
	pull: function (branch, callback) {
		exec('git pull origin ' + branch + ' --ff-only', function (err, stdout, stderr) {
			if(err) {
				callback(new Error("Could not pull from remote: " + err.message));
			}
			else {
				callback();
			}
		})

	},	
};

git.getBranch(function (err, branch) {
	err && console.error(err);
	branch && console.log(branch);

	git.pull(branch, function (err) {
		if(err) {
			throw err;
		}
	});
});

module.exports = git;
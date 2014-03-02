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
					callback(new Error("Could not find active branch name"));
				}
				else {
					callback(null, result[1])
				}
			}
		});
	},

	//makes new branch and pushes to origin
	newBranch: function (name, callback) {
		exec('git checkout -b ' + name, function (err, stdout, stderr) {
			if(err) {
				callback(new Error(stderr));
			}
			else {
				exec('git push origin ' + name + ' --set-upstream', function (err, stdout, stderr) {
					if(err) {
						callback(new Error("Could not push new branch to origin -- local branch still exists"))
					}
					else {
						callback();
					}
				})
			}
		})
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
		exec('git pull --ff-only origin ' + branch, function (err, stdout, stderr) {
			if(err) {
				callback(new Error("Could not pull from remote: " + err.message));
			}
			else {
				callback();
			}
		})
	},	

	/* takes either 2 of three args
	 * 2 args: gets config  (key, callback)
	 * 3 args: sets config  (key, value, callback) */
	config: function (key, arg1, arg2) {
		var value, callback;
		if(arg2 === undefined) {
			callback = arg1;
			exec('git config --get ' + key, function (err, stdout) {
				if(err) {
					callback(err);
				}
				else {
					var value = stdout.toString().trim();
					callback(null, value)
				}
			});
		}
		else {
			value = arg1;
			callback = arg2;
			exec('git config --replace-all ' + key + ' ' + value, function (err, stdout) {
				if(err) {
					callback(err);
				}
				else {
					callback(null, value)
				}
			});
		}
	},

	getConfigStore: function (callback) {
		exec('git config --local --get pivotal.store', function (err, stdout) {
			if(err) {
				git.setConfigStore({active: []}, callback);
			}
			else {
				try {
					var store = JSON.parse(stdout.toString().trim());
					callback(null, store)
				}
				catch(err) {
					callback(new Error("Your pivotal store appears to be corrupted.  Please check it with `git config --local --get pivotal.store`"));
				}
			}
		});
	},

	setConfigStore: function (store, callback) {
		if(store === undefined) {
			callback(new Error("Store must be defined")); 
		}
		else {
			//git escapes quotes, need to add backslashes.  need to make backslashes literal, as well
			var str = JSON.stringify(store).replace(/\\/g,'\\\\').replace(/\"/g, '\\"');
			exec('git config --local --replace-all pivotal.store "' + str + '"', function (err, stdout) {
				if(err) {
					callback(err)
				}
				else {
					callback(null, store);
				}
			});
		}
	}
};

module.exports = git;
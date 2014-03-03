var exec = require('child_process').exec,
	ask = require('./ask'),
	when = require('when');

var check = {
	/* ensures we can run git through node exec */
	git: function (callback) {
		exec('git --version', function (err) {
			if(callback === undefined) {
				throw new Error("checkGit called without callback");
			}
			else if(err) {
				callback(new Error("Can't execute git: " + err.message));
			}
			else {
				callback();
			}
		});
	},

	/* retrieve a config option from git, calls back with error if one doesnt exist */
	gitConfig: function (key, callback) {
		exec('git config --get ' + key, function (err, stdout) {
			if(err) {
				callback(new Error(key + " not found in git config"));
			}
			else {
				callback(null, stdout.toString().trim());
			}
		});
	},
}

module.exports = function (callback) {
	var results = {};

	check.git(function (err) {
		if(err) {
			throw err;
		}
		else {
			checkPivotalAPIKey();
		}
	});

	function checkPivotalAPIKey () {
		check.gitConfig('pivotal.apikey', function (err, apikey) {
			if(err) {
				ask.pivotalAPIKey(checkPivotalAPIKey)
			}
			else {
				results.apikey = apikey;
				checkPivotalUserName();
			}
		})
	}

	function checkPivotalUserName () {
		check.gitConfig('pivotal.username', function (err, username) {
			if(err) {
				ask.pivotalUserName(checkPivotalProject)
			}
			else {
				results.username = username;
				checkPivotalProject();
			}
		})
	}

	function checkPivotalProject () {
		check.gitConfig('pivotal.project', function (err, project) {
			if(err) {
				ask.pivotalProject(results.apikey, done)
			}
			else {
				results.project = project;
				done();
			}
		})
	}

	function done(err) {
		callback(err, results);
	}
};
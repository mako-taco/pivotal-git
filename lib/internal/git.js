var	exec = require('child_process').exec;
var fs = require("fs");
var path = require("path");

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
		//remove a few illegal git characters
		name = name.replace(/\'/g, '').replace(/\!/g, '');
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
	deleteBranch: function (branch, callback) {
		exec('git branch -d ' + branch, function (err, stdout, stderr) {
			if(err) {
				callback(new Error(stderr));
			}
			else {
				exec('git push origin :' + branch, function (err, stdout, stderr) {
					if(err) {
						callback(new Error(stderr));
					}
					else {
						callback();
					}
				});
			}
		});
	},
	deleteLocalBranch: function(opts, callback) {
		var validTypes = ["-d", "-D"];
		
		var branch = undefined;
		var type = "-d";
		if(typeof opts == "string"){
			branch = opts;
		}
		else{
			branch = opts.branch;
			type = opts.type || type;
		}

		if(branch==undefined){
			callback(new Error("Branch must be provided"));
		}
		else if(validTypes.indexOf(type)==-1){
			callback(new Error("Invalide deletion type"));
		}
		else{
			exec('git branch '+type+' '+ branch, function (err, stdout, stderr) {
				if(err) {
					callback(new Error(stderr));
				}
				else {
					callback();
				}
			});
		}

	},
	deleteRemoteBranch: function(branch, remote, callback) {
		remote = remote || "origin";
		exec('git push ' + remote + ' :' + branch, function (err, stdout, stderr) {
			if(err) {
				callback(new Error(stderr));
			}
			else {
				callback();
			}
		});
	},
	push: function (branch, callback) {
		exec('git push origin ' + branch, function (err, stdout, stderr) {
			if(err) {
				callback(new Error("Could not push to origin"))
			}
			else {
				callback();
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
		exec('git pull --ff-only origin ' + branch, function (err, stdout, stderr) {
			if(err) {
				callback(new Error("Could not pull from remote: " + err.message));
			}
			else {
				callback();
			}
		})
	},

	/* merges branch in to this one, squashing, committing w/ message*/
	merge: function (branch, message, callback) {
		
		exec('git merge --squash --ff-only ' + branch, function (err, stdout, stderr) {
			if(err) {
				callback(new Error("Could not merge trivially: " + stderr.toString()));
			}
			else {
				// Merge the given message with the commit messages from the squashed
				// commits, preserving the development history. So first we find the
				// `.git` directory and then we edit the `SQUASH_MSG` file.
				exec("git rev-parse --show-toplevel", function(err, stdout, stderr) {
					if (err) {
						callback(new Error("Could not read Git repo metadata:", stderr.toString()));
					}
					else {
						var squashMsg;
						try {

							var gitDir = path.join(stdout.toString().trim(), ".git"),
								messageFile = path.join(gitDir, "SQUASH_MSG");
							try {
								squashMsg = fs.readFileSync(messageFile, {encoding: 'utf8'});
							}
							catch (e) {
								console.error(err.stack)

								try {
									messageFile = path.join(gitDir, "MERGE_MSG");
									squashMsg = fs.readFileSync(messageFile, {encoding: 'utf8'});
								}
								catch (e) {
									console.error(err.stack)
									//try catch in try catch where does finally get called?  need callback to get called
								}
							}

							if (squashMsg) {
								message = message + "\n\n" + squashMsg;
							}
							fs.writeFileSync(messageFile, message, {encoding: 'utf8'});
						}
						catch (e) {
							// OK, that didn't work -- continue with the regular message
							console.error(e.stack)
						}
						finally {

							// At this point `SQUASH_MSG` contains all we want,
							// if it exists; otherwise just use the message
							var cmd = (squashMsg) ? 'git commit -a --no-edit' : 'git commit -am "' + message + '"';
								
							exec(cmd, function (err, stdout, stderr) {
								if(err) {
									callback(new Error("Could not commit squashed merge: " + stderr.toString()));
								}
								else {
									callback();
								}
							});
						}
					}
				});
			}
		});
	},

	checkout: function (branch, callback) {
		exec('git checkout ' + branch, function (err) {
			if(err) {
				callback(err);
			}
			else {
				callback();
			}
		});
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
				git.setConfigStore({}, callback);
			}
			else {
				try {
					var store = JSON.parse(stdout.toString().trim());
				}
				catch(err) {
					return callback(new Error("Your pivotal store appears to be corrupted.  Please check it with `git config --local --get pivotal.store`"));
				}
				return callback(null, store)
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
					callback(err);
				}
				else {
					callback(null, store);
				}
			});
		}
	},

	doesBranchExist: function(branch, callback) {
		exec('git branch --list ' + branch, function(err, stdout, stderr) {
			if(err) {
				callback(err);
			}
			else {
				if(stdout) {
					callback();
				} else {
					callback(new Error(stderr));
				}
			}
		});
	}
};

module.exports = git;

var check = require('./internal/check');
var pivotal = require('pivotal');
var git = require('./internal/git');
var readline = require('readline');
var colors = require('colors');

var exec = require("child_process").exec;

pivotal.updateStory = require('./internal/pivotal-shim').updateStory,

module.exports = function(args){
	var fromBranch = undefined;
	var msg = undefined;
	var preMergeCommand = undefined;

	for(var i=0; i<args.length; i++){
		var arg = args[i];
		if(arg=="-r"){
			preMergeCommand = args[i+1];
			if(preMergeCommand==undefined){
				console.log("bad use of -r".red);
				process.exit(1);
			}
			else{
				i++;
			}
		}
		else if(fromBranch==undefined){
			fromBranch = arg;
		}
		else if(msg==undefined){
			msg = arg;
		}
		else{
			console.log("Unknown argument: ".red+arg);
			process.exit(1);
		}
	}

	if(fromBranch==undefined){
		console.log("Must provide branch name".red);
		process.exit(1);
	}
	else{
		git.getBranch(function (err, toBranch) {
			if(err){
				throw err;
			}
			else{
				if(toBranch==fromBranch){
					console.log("Can't merge with self!".red);
					process.exit(1);
				}
				else{
					check(function (err, pt) {
						if(err) {
							throw err;
						}

						pivotal.useToken(pt.apikey);

						var msg = args[1];

						if(msg==undefined){
							var rl = readline.createInterface({
								input: process.stdin,
								output: process.stdout
							});

							rl.question("What comment should we leave for this roll? ", function(a){
								rl.close();
								msg = a.trim();
								runner(toBranch, fromBranch, msg, preMergeCommand);
							});
						}
						else{
							runner(toBranch, fromBranch, msg, preMergeCommand);
						}
					});
				}
			}
		});
	}
}

function runner(to, from, msg, command){
	if(command){
		console.log("Moving to "+from);
		git.checkout(from, function(err){
			if(err){
				throw err;
			}
			else{
				console.log("Running `"+command+"`");
				exec(command, function(err){
					if(err){
						git.checkout(to, function(err, stdout, stderr){
							if(err){
								throw err;
							}
							else{
								console.log(("Command ("+command+") failed to run").red);
								console.log(stderr);
								process.exit(1);
							}
						});
					}
					else{
						console.log("Moving to "+to);
						git.checkout(to, function(err){
							if(err){
								throw err;
							}
							else{
								roll(from, msg);
							}
						});
					}
				});
			}
		});
	}
	else{
		roll(from, msg);
	}
}

function roll(branch, msg){
	console.log("Lets Roll...");
	git.merge(branch, msg, function(err){
		if(err){
			throw err;
		}
		else{
			console.log("Rolled "+branch+" into current branch!");
		}
	});
}
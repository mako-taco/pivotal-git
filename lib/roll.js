var check = require('./internal/check');
var pivotal = require('pivotal');
var git = require('./internal/git');
var readline = require('readline');
var colors = require('colors');

pivotal.updateStory = require('./internal/pivotal-shim').updateStory,

module.exports = function(args){
	var branch = args[0];
	var msg = args[1];
	if(branch==undefined){
		console.log("Must provide branch name".red);
		process.exit(1);
	}

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
				merge(branch, msg);
			});
		}
		else{
			merge(branch, msg);
		}
	});
}

function merge(branch, msg){
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
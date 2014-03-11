var check = require('./internal/check');

var commands = {
	find: require("./story/find"),
	ls: require("./story/ls")
}

module.exports = function (args) {
	if(args.length==0){
		help();
		process.exit(1);
	}

	check(function (err, pt) {
		if(err) {
			throw err;
		}
		else{
			var command = commands[args[0]];
			if(command){
				command(pt, args.slice(1));
			}
			else{
				console.log(args[0], "is not a valid command".red);
				help();
			}
		}
	});
}

function help(){
	console.log("Did you mean: `git story find 'some search'`?");
}
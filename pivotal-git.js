var command = process.argv[2];
var args = process.argv.slice(2);

try {
	var fn = require('./lib/' + command);
	fn(args);
}
catch(e) {
	if(command === undefined) {
		console.error("expected a command")
	}
	else {
		console.error("unknown command: " + command);
	}
	process.exit(1);
}
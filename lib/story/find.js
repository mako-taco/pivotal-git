var git = require('../internal/git'),
	ask = require('../internal/ask'),
	colors = require('colors'),
	pivotal = require('pivotal')

	//adding some stuff on to this shitty library, replacing broken functonality
	pivotal.me = require('../internal/pivotal-shim').me,
	pivotal.updateStory = require('../internal/pivotal-shim').updateStory,
	pivotal.getStories = require('../internal/pivotal-shim').getStories;


module.exports = function(pt, args){

	if(args.length==0){
		console.log("must provide a query".red+" -- `git story find 'some query'");
	}
	else{
		pivotal.useToken(pt.apikey);

		var query = {query:buildQuery(pt, args)};
		console.log("querying pivotal for stories matching ".cyan+ ("'"+query.query+"'").yellow);
		pivotal.getStories(pt.apikey, pt.project, query, function (err, result) {
			if(err){
				console.log(err);
				process.exit(1);
			}
			else if(result.stories.stories.length>0){
				result.stories.stories.forEach(function(story, i){
					console.log(("Result "+(i+1)+" of "+result.stories.stories.length).yellow);
					console.log("Id:".cyan, story.id);
					console.log("Name:".cyan, story.name);
					console.log("State:".cyan, story.current_state);
					console.log("Label(s):".cyan, story.labels.map(function(label){
						return label.name;
					}).join(", "));
					console.log("");
				});
			}
			else{
				console.log("No stories found matching '"+args[0]+"'");
			}
		});
	}
}

function buildQuery(pt, args){
	for(var i=0; i<args.length; i++){
		args[i] = args[i].replace(/_work_/g, "_mine_ _curr_");
		args[i] = args[i].replace(/_mine_/g, "owned_by:"+pt.username);
		args[i] = args[i].replace(/_curr_/g, "-state:accepted,unscheduled");
	}
	return args.join(" ");
}
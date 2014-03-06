var readline = require('readline'),
	pivotal = require('pivotal'),
	colors = require('colors'),
	exec = require('child_process').exec;


var ask = {
	/* Prompts for a pivotal API key until a non-blank string is entered,
	 * then stores the value in git local config. */
	pivotalAPIKey: function (callback) {
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});


		rl.question("Pivotal API key (https://www.pivotaltracker.com/profile): ", function (answer) {
			var trimmed = answer.trim();
			if(trimmed === "") {
				rl.write("You need to supply a key.")
				rl.close();
				ask.pivotalAPIKey(callback);
			}
			else {
				rl.close();
				exec('git config --local --add pivotal.apikey ' + trimmed, function (err, stdout, stderr) {
					if(err) {
						callback(new Error("Could not save to git config: " + stderr))
					}
					else {
						callback(trimmed);
					}
				});
			}
		});
	},

	/* prompts for a pivotal user name until a non-blank string is entered,
	 * then stores the value in git local config. */
	pivotalUserName: function (callback) {
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		rl.question("Pivotal user name: ", function (answer) {
			var trimmed = answer.trim();
			if(trimmed === "") {
				rl.write("You need to supply a user name.");
				rl.close();
				ask.pivotalUserName(callback);
			}
			else {
				rl.close();
				exec('git config --local --add pivotal.username ' + trimmed, function (err, stdout, stderr) {
					if(err) {
						callback(new Error("Could not save to git config: " + stderr))
					}
					else {
						callback(null, trimmed);
					}
				});
			}
		});
	},

	/* prompts for a pivotal project after displaying a list of projects,
	 * and saves in local git config */
	pivotalProject: function (apikey, callback) {
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		pivotal.useToken(apikey);

		pivotal.getProjects(function (err, res) { 
			if(err) {
				throw err;
			}

			var projects;

			if(Object.prototype.toString.call( res.project ) === '[object Array]'){
				projects = res.project.map(function (project, index) {
					return {
						index: index + 1,
						id: ~~project.id,
						name: project.name
					}
				});
			}
			else{
				projects = [{
					index: 1,
					id: ~~res.project.id,
					name: res.project.name
				}];
			}

			if(projects.length === 0) {
				throw new Error("No projects found for " + apikey);
			}

			projects.forEach(function (project) {
				rl.write((project.index + ". " + project.name).cyan + '\n');
			});
			
			rl.question("Choose your project: ", function (answer) {
				var choice = ~~answer.trim();
				if(choice < 1 || choice > projects.length) {
					rl.write("Please enter a number between 1 and " + (projects.length) + "\n");
					rl.close();
					ask.pivotalProject(apikey, callback);
				}
				else {
					rl.close();
					exec('git config --local --replace-all pivotal.project "' + projects[choice - 1].id + '"', function (err, stdout, stderr) {
						if(err) {
							callback(new Error("Could not save to git config: " + stderr))
						}
						else {
							callback(null, projects[choice - 1].id);
						}
					});
				}
			});
		});
	},

	/* prompts for a story choice after displaying a list of stories,
	 * calls back with the chosen story */
 	pivotalStory: function (stories, callback) {
 		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
 		var choices = stories.map(function (story, index) {
 			return {
				index: index + 1,
				id: story.id,
				name: story.name,
				estimate: story.estimate === undefined ? -1 : ~~story.estimate,
				state: story.current_state,
				type: story.story_type
			}
		})

		choices.forEach(function (story) {
			displayEstimate = (story.estimate < 0) ? "-" : (story.estimate).toString();
			var type = story.type.toUpperCase();
			if(type == "BUG") {
				type = ("B" + displayEstimate).red;
			}
			else if(type == "FEATURE") {
				type = ("F" + displayEstimate).yellow;
			}
			else if(type == "CHORE") {
				type = ("C" + displayEstimate).gray;
			}

			var state = story.state;
			if(state == "unstarted") {
				state = " " + state.green;
			}
			else if(state == "started") {
				state = " " + state.blue;
			}
			else if(state == "rejected") {
				state = " " + state.red;
			}
			else {
				state = " " + state.gray;
			}

			rl.write((story.index + ". ").cyan + type + " " + state + (" " + story.name).cyan + "\n");
		});
		
		rl.question("Choose a story: ", function (answer) {
			var choice = ~~answer.trim();
			if(choice < 1 || choice >= stories.length) {
				rl.write("Please enter a number between 1 and " + (stories.length - 1));
				ask.pivotalStory(stories, callback)
			}
			else {
				rl.close();
				callback(null, choices[choice - 1])
			}
		});
	},

	branchName: function (story, callback) {
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			completer: function (line) {
				var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
				// show all completions if none found
				return [hits.length ? hits : completions, line]
			}
		});

		var suggestedName = story.name.replace(/\s+/g, '-').toLowerCase();
		var split = suggestedName.split('-')
		var completions = split.map(function (segment, index) {
			return split.slice(0, index).join('-');
		});

		rl.question("branch name (" + suggestedName + "): ", function (answer) {
			var name = answer.trim() || suggestedName;
			name = name + '-' + story.id;
			rl.close();
			callback(null, name);
		})
	}
}

module.exports = ask;
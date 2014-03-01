var readline = require('readline'),
	pivotal = require('pivotal'),
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
				rl.write("You need to supply a user name.")
				ask.pivotalUserName(callback);
			}
			else {
				rl.close();
				exec('git config --local --add pivotal.username "' + trimmed + '"', function (err, stdout, stderr) {
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
			
			var projects = res.project.map(function (project, index) {
				return {
					index: index + 1,
					id: ~~project.id,
					name: project.name
				}
			});

			if(projects.length === 0) {
				throw new Error("No projects found for " + apikey);
			}

			projects.forEach(function (project) {
				rl.write(project.index + ". " + project.name + '\n');
			});
			
			rl.question("Choose your project: ", function (answer) {
				var choice = ~~answer.trim();
				if(choice < 1 || choice >= projects.length) {
					rl.write("Please enter a number between 1 and " + (projects.length - 1));
					ask.pivotalProject(callback);
				}
				else {
					rl.close();
					exec('git config --local --add pivotal.project "' + projects[choice].id + '"', function (err, stdout, stderr) {
						if(err) {
							callback(new Error("Could not save to git config: " + stderr))
						}
						else {
							callback(projects[choice].id);
						}
					});
				}
			});
		});
	}

	/* prompts for a story choice after displaying a list of stories,
	 * calls back with the chosen story */
 	pivotalStory: function (stories, callback) {
 		var choices = stories.map(function (story) {
			return {
				id: story.id,
				name: story.name,
				owner: story.owner,
				state: story.state,
				type: story.type
			}
		}).forEach(function (story) {
			rl.write(story.index + ". " + story.type.toUpperCase() + " " + story.name + " (" + story.owner ")\n");
		});
		
		rl.question("Choose a story: ", function (answer) {
			var choice = ~~answer.trim();
			if(choice < 1 || choice >= stories.length) {
				rl.write("Please enter a number between 1 and " + (stories.length - 1));
				ask.pivotalStory(stories, callback)
			}
			else {
				rl.close();
				callback(null, choices[choice])
			}
		});
	}
}

module.exports = ask;
var git = require('../internal/git'),
	colors = require('colors'),
	pivotal = require('pivotal')

	//adding some stuff on to this shitty library, replacing broken functonality
	pivotal.me = require('../internal/pivotal-shim').me,
	pivotal.updateStory = require('../internal/pivotal-shim').updateStory,
	pivotal.getStories = require('../internal/pivotal-shim').getStories;


var DESC_SIZE = 75;

module.exports = function(pt, args){
	git.getConfigStore(function(err, storiesByBranch){
		if(err){
			throw err;
		}
		else{
			var stories = {};
			var storyIds = [];
			var branches = Object.keys(storiesByBranch);
			for(var i=0; i<branches.length; i++){
				var branch = branches[i];
				if(branch!="active"){
					var story = storiesByBranch[branch];
					if(stories[story.id]==null){
						storyIds.push(story.id);
						stories[story.id] = {
							type: story.story_type,
							name: story.name,
							description: story.description.replace(/\n/g, " "),
							branches: [branch]						
						}
					}
					else{
						stories[story.id].branches.push(branch);
					}
				}
			}

			if(storyIds.length){
				for(var i =0; i<storyIds.length; i++){
					var storyId = storyIds[i];
					var story = stories[storyId];
					console.log("Id:".cyan, storyId);
					console.log("Name:".cyan, story.name);
					if(story.description.length<DESC_SIZE){
						console.log("Description:".cyan, story.description);
					}
					else{
						console.log("Description:".cyan);
						for(var j=0; j<story.description.length; j+=DESC_SIZE){
							console.log("\t", story.description.substring(j, j+DESC_SIZE));
						}
					}
					if(story.branches.length==1){
						console.log("Branch:".cyan, story.branches[0]);	
					}
					else{
						console.log("Branches:".cyan);
						for(var j=0; j<story.branches.length; j++){
							var branch = story.branches[j];
							console.log("\t",(j+1)+".", branch);
						}
					}
					console.log("");
				}
			}
			else{
				console.log("No active stories");
			}

		}
	});
}
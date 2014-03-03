var check = require('./internal/check'),
	git = require('./internal/git'),
	ask = require('./internal/ask'),
	readline = require('readline'),
	colors = require('colors'),
	pivotal = require('pivotal')

	//adding some stuff on to this shitty library, replacing broken functonality
	pivotal.me = require('./internal/pivotal-shim').me,
	pivotal.updateStory = require('./internal/pivotal-shim').updateStory,
	pivotal.getStories = require('./internal/pivotal-shim').getStories;

module.exports = function (args) {
	check(function (err, pt) {
		if(err) {
			throw err;
		}

		git.getConfigStore(function (err, store) {
			if(err) {
				throw err;
			}
			var stores = [];
			for(var key in store) {
				stores.push({
					branch: key,
					story: store[key]
				});
			}
			
			var done = 0;
			var started = 0;
			stores.filter(function (store) {
				return store.story.state == "finished";
			}).forEach(function (store) {
				var story = store.story;
				var branch = store.branch;
				var update = {current_state: "delivered"}
				started++;
				
				//deliver the story
				pivotal.updateStory(pt.apikey, pt.project, story.id, update, function (err) {
					if(err) {
						done++;
						checkDone();
						console.error("could not deliver ".red + story.name.grey)
					}
					else {
						console.log("delivered ".cyan + story.name.grey);
						//delete remote branch
						//delete local branch
						git.deleteBranch(branch, function (err) {
							if(err) {
								console.error("could not delete branch ".red + branch.grey);
							}
							done++
							checkDone();
						});
					}
				});	
			});

			if(started == 0) {
				console.log("no stories to deliver".cyan);
			}

			var checkDone = function() {
				if(done == started) {
					//do deploy here
					process.exit(0);
				}
			}

		});
	});
}

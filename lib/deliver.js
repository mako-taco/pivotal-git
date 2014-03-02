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

			stores.filter(function (store) {
				return store.story.current_state == "finished";
			}).forEach(function (store) {
				//deliver the story
				//delete remote branch
				//delete local branch
				var story = store.story;
				var branch = store.branch;
				var update = {current_state: "delivered"}
				pivotal.updateStory(pt.apikey, pt.project, story.id, update, function (err) {
					if(err) {
						console.error("could not deliver ".red + story.name.grey)
					}
					else {
						console.log("delivered ".cyan + story.name.grey);
						git.deleteBranch(branch, function (err) {
							if(err) {
								console.error("could not delete branch ".red + branch.grey);
							}
						});
					}
				});	
			});
		});
	});
}

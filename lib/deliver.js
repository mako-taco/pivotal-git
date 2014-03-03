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
		
		pivotal.useToken(pt.apikey);

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
			var notReady = 0;
			stores.filter(function (store) {
				return store.story.id != undefined;
			}).forEach(function (store) {
				started++;
				var branch = store.branch;
				var update = {current_state: "delivered"};

				pivotal.getStory(pt.project, store.story.id, function(err, story){
					if(err && err.code ==404){
						console.log(store.story.id, "is invalid");
					}
					else if(err){
						console.log(err);
						throw new Error(err.desc);
					}
					else{
						if(story.current_state=="finished"){
				
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
						}
						else{
							notReady++;
							checkDone();
						}
					}
				});
			});

			if(started == 0) {
				console.log("no stories to deliver".cyan);
			}

			var checkDone = function() {
				if(started == notReady){
					console.log("no stories waiting to be delivered".cyan);
					process.exit(0);
				}

				if(done == started-notReady) {
					//do deploy here
					process.exit(0);
				}
			}

		});
	});
}

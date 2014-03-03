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
		
		//set up PT
		pivotal.useToken(pt.apikey);
		
		//get data about my PT USER
		pivotal.me(pt.apikey, function (err, me) {
			if(err) {
				throw err;
			}

			pt.me = me;

			//assume user is trying to start a story with a PT id
			if(args[0]!=null){
				storyByIdProcess(args[0]);
			}
			//assume user want a list of stories to pick from
			else{
				listStoryProcess();
			}

		});

		function listStoryProcess(){
			var query = {query:"-state:accepted,delivered"};
			console.log("querying pivotal for stories".cyan);
			pivotal.getStories(pt.apikey, pt.project, query, function (err, result) {
				if(err) {
					throw err;
				}

				/* using the api for stories does not get them in priority order, but 
				 * /search does, so we're using that as a result, we get back like 200 
				 * stories... no way to filter by iteration. So we take the first 9. */
				var stories = result.stories.stories.slice(0,9);
				ask.pivotalStory(stories, function (err, story) {
					if(err) {
						throw err;
					}
					else{
						pickedStoryProcess(story);
					}
				});
			});
		}

		function storyByIdProcess(storyId){
			pivotal.getStory(pt.project, storyId, function(err, story){
				if(err && err.code==404){
					throw new Error("Story "+storyId+" not found");
				}
				else if(err){
					throw new Error(err.desc);
				}
				else{
					pickedStoryProcess(story);
				}
			});
		}

		function pickedStoryProcess(story){
			git.getBranch(function (err, branch) {
				if(err) {
					throw err;
				}

				//get up to date
				console.log(("pulling from origin " + branch).cyan)
				git.pull(branch, function (err) {
					if(err) {
						throw err;
					}

					//check out branch
					ask.branchName(story, function (err, newBranch) {
						console.log(("checking out new branch from " + branch).cyan)
						git.newBranch(newBranch, function (err) {
							if(err) {
								throw err;
							}
							
							var update = {current_state: 'started', owner_ids: [pt.me.id]};

							//already estimated, skip
							if(story.estimate < 0) {
								console.log("no points estimate! automatically estimating 1pt".cyan);
								update.estimate = 1;	
							}

							//start story
							pivotal.updateStory(pt.apikey, pt.project, story.id, update, function (err) {
								if(err) {
									console.error("Could not mark story as started:".red, err.message);
								}
								else {
									console.log("starting story".cyan);
								}
								
								//set current story in config
								git.config("branch." + newBranch + ".story", story.id, function (err) {
									if(err) {
										throw err;
									}

									//set current story in config
									git.config("branch." + newBranch + ".parent", branch, function (err) {
										if(err) {
											throw err;
										}

										//keep track of active stories
										git.getConfigStore(function (err, store) {
											if(err) {
												throw err;
											}

											store[newBranch] = story;
											git.setConfigStore(store, function (err) {
												if(err) {
													throw err;
												}

												console.log("done!".cyan);
											});
										});
									});
								});
							});
						});
					});
				});
			});
		}
	});
}

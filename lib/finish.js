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

		git.getBranch(function (err, branch) {
			if(err) {
				throw err;
			}

			//grab current story id from git config
			git.config("branch." + branch + ".story", function (err, story_id) {
				if(err) {
					throw err;
				}

				//grab the merge target
				git.config("branch." + branch + ".parent", function (err, parent) {
					if(err) {
						console.error("can't finish what you haven't started!".red);
						process.exit(1);
					}

					//get us up to date with parent
					console.log(("attempting trivial merge with " + parent).cyan);
					git.pull(parent, function (err) {
						if(err) {
							console.error(("failed! please make sure you are up to date with origin " + parent).red);
							process.exit(1);
						}

						//push
						console.log(("pushing " + branch + " to origin").cyan);
						git.push(branch, function (err) {
							if(err) {
								throw err;
							}

							//check out parent and merge in child
							git.checkout(parent, function (err) {
								if(err) {
									throw err;
								}

								git.getConfigStore(function (err, store) {
									if(err) {
										throw err;
									}

									var story = store[branch];
									if(!story) {
										throw new Error("Could not find active story for " + branch);
									}

									console.log(("squashing " + branch + " in to " + parent).cyan)
									git.merge(branch, "[#" + story.id + "] " + story.name, function (err) {
										if(err) {
											throw err;
										}

										//push changes up
										console.log("pushing changes to origin".cyan);
										git.push(parent, function (err) {
											if(err) {
												throw err;
											}

											//mark story as done on pivotal
											var update = {current_state: 'finished'};
											pivotal.updateStory(pt.apikey, pt.project, story.id, update, function (err) {
												if(err) {
													throw new Error("Could not mark story as delivered: " + err.message);
												}
												
												//set state in git config to 'finished'
												store[branch].state = "finished"
												git.setConfigStore(store, function (err) {
													if(err) {
														throw new Error("Could not update story status in git config: " + err.message);
													}

													console.log("done!".cyan)
												});
											});
										});
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

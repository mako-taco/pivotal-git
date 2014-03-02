var check = require('./internal/check'),
	git = require('./internal/git'),
	ask = require('./internal/ask'),
	readline = require('readline'),
	colors = require('colors'),
	pivotal = require('pivotal')

	//adding some stuff on to this shitty library, replacing broken functonality
	pivotal.me = require('./internal/pivotal-shim').me,
	pivotal.updateStory = require('./internal/pivotal-shim').updateStory;

module.exports = function (args) {
	check(function (err, pt) {
		if(err) {
			throw err;
		}

		pivotal.useToken(pt.apikey);
		pivotal.me(pt.apikey, function (err, me) {
			if(err) {
				throw err;
			}

			pt.me = me;

			pivotal.getStories(pt.project, {limit: 5}, function (err, res) {
				ask.pivotalStory(res.story, function (err, story) {
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
									
									pivotal.updateStory(pt.apikey, pt.project, story.id, {current_state: 'started', owner_ids: [pt.me.id]}, function (err) {
										if(err) {
											console.error("Could not mark story as started:".red, err.message);
										}
										else {
											console.log("starting story".cyan);
										}

										//save branch, newBranch, story
										var record = {
											git: {
												parent: branch,
												branch: newBranch
											},
											story: story
										};

										git.getConfigStore(function (err, store) {
											
											store.active.push(record);
											git.setConfigStore(store, function (err) {
												if(err) {
													throw err;
												}

												//set current story in config
												git.config("pivotal.current", story.id, function (err) {
													if(err) {
														throw err;
													}

													console.log("done!".cyan);
												});
											});
										});
									})
								});
							});
						})
					})
				});
			});
		})
	});
}

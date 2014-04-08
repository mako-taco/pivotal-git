var check = require('./internal/check'),
	git = require('./internal/git'),
	readline = require('readline'),
	colors = require('colors');

module.exports = function (args) {
	if(!args.length) {
		throw new Error("No branch names passed");
	}

	args.forEach(function(branch) {
		git.doesBranchExist(branch, function(err) {
			if(err) {
				console.error("local branch ".red + branch.grey + " does not exist".red);
				return;
			}

			git.deleteLocalBranch(branch, function(err) {
				if(err) {
					console.error("could not delete local branch ".red + branch.grey);
					return;
				}
				console.log("cleaning up local git branch ".cyan + branch.grey);

				var remote = "origin";
				git.deleteRemoteBranch(branch, remote, function(err) {
					var remoteBranchFullName = remote + '/' + branch;
					if(err) {
						console.error("could not delete remote branch ".red + remoteBranchFullName.grey);
						return;
					}
					console.log("cleaning up remote git branch ".cyan + remoteBranchFullName.grey);
				});
			});
		});
	});
}
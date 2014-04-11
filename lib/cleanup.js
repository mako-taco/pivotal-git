var check = require('./internal/check'),
	git = require('./internal/git'),
	readline = require('readline'),
	colors = require('colors');

module.exports = function (args) {
	if(!args.length){
		throw new Error("No args passed");
	}

	var forceLocal = undefined; //-D
	var remote = undefined; //-r name
	var forceRemote = undefined; //-K
	var branches = [];

	for(var i=0; i<args.length; i++){
		var arg = args[i];
		if(arg=="-D"){
			forceLocal= true;
		}
		else if(arg=="-d"){
			forceLocal = false;
		}
		else if(arg=="-r"){
			remote = args[i+1] || new Error("No remote name provided");
			i++;
		}
		else if(arg=="-K"){
			forceRemote=true;
		}
		else{
			branches = args.slice(i);
			break;
		}
	}

	forceLocal = forceLocal || false;
	forceRemote = forceRemote || false;
	remote = remote || "origin";

	if(remote instanceof Error){
		throw remote;
	}
	else if(branches.length==0) {
		throw new Error("No branch names passed");
	}

	branches.forEach(function(branch) {
		git.doesBranchExist(branch, function(err) {
			if(err) {
				console.error("local branch ".red + branch.grey + " does not exist".red);
				if(forceRemote){
					deleteRemote(remote, branch);
				}
			}
			else{
				var opts = {
					type: forceLocal ? "-D" : "-d",
					branch:branch
				}
				git.deleteLocalBranch(opts, function(err) {
					if(err) {
						console.error("could not delete local branch ".red + branch.grey);
						if(forceRemote){
							deleteRemote(remote, branch);
						}
					}
					else{
						console.log("cleaning up local git branch ".cyan + branch.grey);
						deleteRemote(remote, branch);
					}
				});
			}
		});
	});
}

function deleteRemote(remote, branch){
	git.deleteRemoteBranch(branch, remote, function(err) {
		var remoteBranchFullName = remote + '/' + branch;
		if(err) {
			var msg = "could not delete remote branch ".red + remoteBranchFullName.grey
			if(err.message.indexOf("remote ref does not exist")!=-1){
				console.error(msg+" remote ref cannot be found".red);
			}
			else{
				console.error(msg);
				console.error(err.message);
			}
		}
		else{
			console.log("cleaning up remote git branch ".cyan + remoteBranchFullName.grey);
		}
	});
}
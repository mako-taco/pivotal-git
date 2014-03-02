var request = require('superagent');

var pivotal = {
	updateStory: function (token, project_id, story_id, update, callback) {
		request.put("https://www.pivotaltracker.com/services/v5/projects/" + project_id + "/stories/" + story_id)
		.set("Content-Type","application/json")
		.set("X-TrackerToken", token)
		.send(update)
		.end(function (err, res) {
			if(err) {
				callback(err);
			}
			else if(res.status != 200) {
				callback(new Error(res.status + ": " + res.text))
			}
			else {
				callback(null);
			}
		});
	},

	me: function (token, callback) {
		request.get("https://www.pivotaltracker.com/services/v5/me")
		.set("Content-Type","application/json")
		.set("X-TrackerToken", token)
		.end(function (err, res) {
			if(err) {
				callback(err);
			}
			else if(res.status != 200) {
				callback(new Error(res.status + ": " + res.text))
			}
			else {
				callback(null, res.body);
			}
		});
	},

	getStories: function (token, project_id, filter, callback) {
		request.get("https://www.pivotaltracker.com/services/v5/projects/" + project_id + "/search")
		.query(filter)
		.set("Content-Type","application/json")
		.set("X-TrackerToken", token)
		.end(function (err, res) {
			if(err) {
				callback(err);
			}
			else if(res.status != 200) {
				callback(new Error(res.status + ": " + res.text))
			}
			else {
				callback(null, res.body);
			}
		});
	}
}



module.exports = pivotal;
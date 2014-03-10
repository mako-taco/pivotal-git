node-git-pivotal
================

An integration for Git and Pivotal Tracker, written in node. Install it with 
`npm install -g pivotal-git`

## git start
## git list
## git finish
## git deliver

## git story [find <search> | ls]

Learn about PT stories!

### git story find <search>

lets you search pt for stories.

All args after find are joined together with a space. This means `git story find "my best friend"` is the same as `git story find my best friend`.

**Search Commands**

* [Any of the PT search commands](https://www.pivotaltracker.com/help/faq#howcanasearchberefined)
* _mine_: will only list your stories
* _curr_: will only list stories that have been scheduled and have not be accepted.
* _work_: combines _mine_ and _curr_.

**Example**

* `git story find _mine_` will list all of my stories.
* `git story find on-site` will list all stoires that match "on-site".


### git story ls: lists our all the stories you have running.

This lists out all the stories you have pending that you have started via `git start`.



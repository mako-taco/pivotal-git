node-git-pivotal
================

An integration for Git and Pivotal Tracker, written in node. Install it with 
`npm install -g pivotal-git`

## git start
## git list

This lists out all the stories you have pending that you have started via `git start`.

## git finish
## git deliver

## git roll [-r command] \<branch\> [msg]

Rolls (read merge via a squash) provided branch name into current branch commiting it with provided message.

* \<branch\>: the branch to be rolled into your current branch.
* [msg]: the message to be used for the merge commit. Optionaly can be entered via a later prompt.
* [-r command]: run custom command in <branch> before merging. If this command exits with a code other than 0 the roll will stop.

## git story find \<search\>

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

## git cleanup [[-D|-d] -K -r \<remote\>] \<branches...\>

Removes both the local and remote copies of specified branch(es).

* -D: Delete a branch irrespective of its merged status.
* -d: (default) The branch must be fully merged in its upstream branch, or in HEAD if no upstream was set
* -K: force remote KILL even if local branch is not found or can't be deleted.
* -r \<remote\>: (default:origin) lets you set a custom remote.

**Examples**
* `git cleanup myTopicBranch` will delete the local branch _myTopicBranch_ and the remote branch _origin/myTopicBranch_
* `git cleanup -D -K -r fork idea other-idea` where _idea_ is a local unmerged branch and _other-idea_ is only remote this command will delete _idea_, _fork/idea_, _fork/other-idea_.





test:
	mocha test/ -R spec

install:
	node ./lib/install

.PHONY: install uninstall
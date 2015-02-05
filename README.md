#CD Server

Go to project directory and run:

	vagrant up
	vagrant ssh

In VM run:
	
	sudo apt-get install curl
	sudo apt-get install nodejs
	cd data/
	node server.js
	
In the host OS go to this address to test to see if it's working:
	
	localhost:1234

In the host OS, go to the project directory and run:
	
	vagrant login

Log in the Vagrant Cloud/Atlas name and password.  Then run:

	vagrant share
	
Add the url to a repo webhook.

You can use this one, either fork or I can give you permissions: [Analysis](https://github.ncsu.edu/aisobran/Analysis)

It's performs a code complexity analysis.

The server will just output the date it is pinged

##Notes

Go here to create a Vagrant Cloud/Atlas account: [Vagrant Cloud](https://atlas.hashicorp.com/boxes/search?utm_source=vagrantcloud.com&vagrantcloud=1)

To use node package manager, in guest OS run:

	sudo apt-get install npm

If you start running into issues with nodejs and npm check out this StackOverflow comment: [StackOverflow](http://stackoverflow.com/a/21715730)


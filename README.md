#Wildtrack Build Server

This build server was constructed from a main Vagrant box that runs an http server and a series of Docker nodes that run build scripts to build a javascript project.  The current setup is hardcoded to build the repo [here](https://github.com/Wildtrack/MiniProject1).  The server is brought online and then forwarded through Vagrant to a public URL.  That URL is placed in a git hook within the repo.  Once all of that takes place the server runs everything automatically.  

Whenever there is a push the server builds the project in parallel Docker nodes.  The output of the build is displayed in the local server [URL](http://localhost:2234).  Every time the server runs the build it is on a fresh Docker buildbox, so there is no need for any clean functionality.  Whenver there ceases to be a need for the build server vagrant destroy removes everything.

##Prerequisites:  
Requires Ansible and Vagrant.  Installation information is in the notes below.

#Build

To build the project first clone the project and go to project directory and run:

	vagrant up

Note that Vagrant up takes a LONG TIME.  Don't CRTL-C, the script is working even if it seems like it's not.  The script will download the needed vagrant box, install everything that it needs, and pull the image for the Docker buildbox, so especially if it's the first time you've run it, it takes awhile.

Next run:

	vagrant ssh

In the vagrant box run:
	
	cd data/
	node server.js
	
In the host OS go to this [URL](http://localhost:2234) to test to see if the server is running.

In the host OS, go to the project directory and run:
	
	vagrant login

Log in the Vagrant Cloud/Atlas name and password.  Then run:

	vagrant share

	
Add the url to a repo webhook [here](https://github.com/Wildtrack/MiniProject1/settings/hooks).  

Push to the repo, or use the redeliver button to trigger a build.  The image below shows the redeliver button.

In the host OS go to this [URL](http://localhost:2234) to see the output of the buildscript.

Whenever you are done with the server run:

	vagrant destroy

##Notes

Adding a URL to the repo will not be possible for teaching staff before they are added to the organization.  Just email one of us and we can add you to the organization.  For this specific usecase it is a bit problematic, but in most situations the only users of a buildbox would already be members of the github organization.  Anyway, sorry for the inconvienence.

Ansible install:  The install information is [here](http://docs.ansible.com/intro_installation.html).  

Vagrant install:  The install information is [here](https://docs.vagrantup.com/v2/installation/)

Go here to create a Vagrant Cloud/Atlas account: [Vagrant Cloud](https://atlas.hashicorp.com/boxes/search?utm_source=vagrantcloud.com&vagrantcloud=1)




#Wildtrack Build Server

This build server was constructed from a main Vagrant box that runs a nodejs http server and a series of Docker nodes that run build scripts to build a javascript webapp using nodejs, grunt, and bower.  The current setup is builds the repo [here](https://github.com/Wildtrack/MiniProject1) from CSC510 but could be easily applied to other nodejs projects.  The server is brought online in Vagrant and then forwarded through Vagrant to a public URL.  That URL is placed in a git hook within the repo.  Once all of that takes place the server runs everything automatically.  The sequence of events during a push is push event, github webhook to server, server response, spawn docker, clone repo in docker, npm install in docker, grunt build and test in docker, output of build status saved from docker in the nodejs server and made accessible through http.  Everything is automatically reset with the only artifact remaining being the build history (available through http).   

Whenever there is a push the server builds the project in parallel Docker nodes.  The output of the build is displayed in the local server [URL](http://localhost:2234) and through the vagrant share URL accessible from anywhere.  Every time the server runs the build it is on a fresh Docker buildbox, so there is no need for any clean functionality.  Whenver there ceases to be a need for the build server vagrant destroy removes everything.

##Prerequisites:  
Requires Ansible and Vagrant.  Installation information is in the notes below.

#Build

To build the project first clone the project and go to project directory and run:

	vagrant up

Screenshot of response from command:
![VagrantUp](https://github.com/Wildtrack/Server/blob/master/img/VagrantUp.png)

Note that Vagrant up takes a LONG TIME.  Don't CRTL-C, the script is working even if it seems like it's not.  The script will download the needed vagrant box, install everything that it needs, and pull the image for the Docker buildbox, so especially if it's the first time you've run it, it takes awhile.

Next run:

	vagrant ssh

Screenshot of response from command:
![VagrantSSH](https://github.com/Wildtrack/Server/blob/master/img/VagrantSSH.png)

In the vagrant box run:
	
	cd data/
	node server.js
	
In the host OS go to this [URL](http://localhost:2234) to test to see if the server is running.

In the host OS, go to the project directory and run:
	
	vagrant login

Log in the Vagrant Cloud/Atlas name and password.  Then run:

	vagrant share

	
Add the url to a repo webhook [here](https://github.com/Wildtrack/MiniProject1/settings/hooks).  

Screenshot of response from command:
![Webhook](https://github.com/Wildtrack/Server/blob/master/img/Webhook.png)

Push to the repo, or use the redeliver button to trigger a build.  The image below shows the redeliver button.

![Redeliver](https://github.com/Wildtrack/Server/blob/master/img/Redeliver.png)

Below a github webhook triggering on a push event:
![GithubWebHook](img/githook_request.png =500x)

In the host OS go to the vagrant url supplied in the body of the github webhook response or this [URL](http://localhost:2234) to see the output of the buildscript.

![WebHookResponse](img/githook_response.png =500x)

The build and testing results are saved so the whole history can be viewed (most recent first).  Below shows dependency install results using node package manager.

![BuildHistory](img/build_history.png =500x)

Below shows the results of a grunt build and test using jshint.

![GruntTest](img/build_history_grunt.png =500x)

Whenever you are done with the server run:

	vagrant destroy

Screenshot of response from command:
![VagrantDestroy](https://github.com/Wildtrack/Server/blob/master/img/VagrantDestroy.png)

##Notes

Adding a URL to the repo will not be possible for teaching staff before they are added to the organization.  Just email one of us and we can add you to the organization.  For this specific usecase it is a bit problematic, but in most situations the only users of a buildbox would already be members of the github organization.  Anyway, sorry for the inconvienence.

Ansible install:  The install information is [here](http://docs.ansible.com/intro_installation.html).  

Vagrant install:  The install information is [here](https://docs.vagrantup.com/v2/installation/)

Go here to create a Vagrant Cloud/Atlas account: [Vagrant Cloud](https://atlas.hashicorp.com/boxes/search?utm_source=vagrantcloud.com&vagrantcloud=1)

##Evaluation Summary

Triggered Builds - Performed by github webhook and triggered during push event.  Nodejs server receives webhook, verifies the github webhook is the request and starts the building process.

Dependency Management - Vagrant and docker come with all dependencies needed to run the server are made ready by ansible.  Dependency management for the project being buld is performed by npm install and bower.

Build Script Execution - Performed by ansible, shell scripts, and nodejs server.  Build also performed by grunt.  Nodejs launches docker using one shell script to pull docker and another to send docker a shell script for execution.  In docker, builds are performed by grunt. 

Multiple Nodes - The nodejs spawns multiple docker nodes if multiple requests are made, each with their own build instances and results.

Status - Status is accessible either through localhost or url supplied by vagrant share(which redirects to the running nodejs server)




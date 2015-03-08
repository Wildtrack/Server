#Wildtrack Build Server

##Setup
Setup is very similar to the original iteration of the build server created for milestone 1.  The information below is a carryover from M1 with a few changes.

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
	npm install
	sudo node server2.js

This command has changed because we are now running commands from within the nodejs server using [docker-exec](https://www.npmjs.com/package/docker-exec). Furthermore, we changed the name of the server file to server2.js.  Sudo is necessary for this command as well since docker-exec requires the command starting the software have root access.
	
In the host OS go to this [URL](http://localhost:2234) to test to see if the server is running.

In the host OS, go to the project directory and run:
	
	vagrant login

Log in the Vagrant Cloud/Atlas name and password.  Then run:

	vagrant share

A url will be displayed after vagrant share has run, a screenshot is below:

![VagrantShare]	

Once the server is up and vagrant share has been run the server state is visible at the vagrant share address.  The buttons at the top of the page are currently nonfunctional.

Screenshot of the initial state of the server:

![InitialState]()

We are using building a different project at this point.  The webhook should be added [here](https://github.com/Wildtrack/maze/settings/hooks/new).  There is an image of adding the webhook below: 

![Webhook](https://github.com/Wildtrack/Server/blob/master/img/Webhook.png)

Push to the repo, or use the redeliver button to trigger a build.  The image below shows the redeliver button.

![Redeliver](https://github.com/Wildtrack/Server/blob/master/img/Redeliver.png)

Once the webhook has been added the server will be immediately pinged as if a commit had been made.  The build reports are given in order from oldest to newest on the left side of the page in blue.  Upon clicking the date and time the full report is given. 


##Test

This section explains the data in the web page that is displayed by the server.

Our tests are run in [mocha](http://http://mochajs.org/), coverage is in [istanbul](https://github.com/gotwarlost/istanbul), and static analysis is done with [jshint](http://http://jshint.com/).  The mocha tests are shown below:

![Mocha](https://github.com/Wildtrack/Server/blob/test/img/Mocha.png)

Istanbul coverage:

![Istanbul](https://github.com/Wildtrack/Server/blob/test/img/Istanbul.png)

JShint static analysis:

![jshint](https://github.com/Wildtrack/Server/blob/test/img/jshint.png)

##Analysis

The entire test suite including Mocha, Istanbul, and JShint is run twice.  The first run, for base analysis, produces the following base coverage report by running istanbul on the entire set of javascript files in the root against the handrwritten mocha tests.  A few exceptions are for the canvasengine and jquery modules, and the maze.js file.  The exception of maze.js is based on the fact that it needs canvasengine which is only available in the browser and causes istanbul to fail:

![CoverOne](https://github.com/Wildtrack/Server/blob/test/img/CoverOne.png)


To separate the two runs there is a dividing line as shown below:

![Divider](https://github.com/Wildtrack/Server/blob/test/img/Divider.png)

The second run, for extended analysis, utilizes the main.js script found [here].  This script is run against the backtrack.js file found [here](https://github.com/Wildtrack/Server/blob/Test/data/main.js).  It prodces a set of tests inside the docker buildbox and runs coverage using those tests against the same set of files.  Including them in the coverage report results in this coverage report:

![CoverTWo](https://github.com/Wildtrack/Server/blob/test/img/CoverTwo.png)

Additionally the second run through displays a static analysis tool we built for the server.  The file is called commentChecker.js, and it is run against all of the javascript files in the root of the project with the same exception for canvasengine, and jquery.  The tool was developed using esprima and displays he nuber of line comments per total number of lines of code, number of of block comments per total number of lines of code, number of line comments per function, and number of block comments per function. CommentChecker.js is found [here](https://github.com/Wildtrack/Server/blob/Test/data/commentCheck.js).  A screenshot of the commentChecking functionality is found below:

![CommentCheck](https://github.com/Wildtrack/Server/blob/test/img/CommentCheck.png)

A rule was generated to reject the build if statement coverage is below 50% in the second run as shown in the screenshot below:

![Rejected](https://github.com/Wildtrack/Server/blob/test/img/Rejected.png)


Whenever you are done with the server run:

	vagrant destroy

Screenshot of response from command:
![VagrantDestroy](https://github.com/Wildtrack/Server/blob/master/img/VagrantDestroy.png)

##Notes

Adding a URL to the repo will not be possible for teaching staff before they are added to the organization.  Just email one of us and we can add you to the organization.  For this specific usecase it is a bit problematic, but in most situations the only users of a buildbox would already be members of the github organization.  Anyway, sorry for the inconvienence.

Ansible install:  The install information is [here](http://docs.ansible.com/intro_installation.html).  

Vagrant install:  The install information is [here](https://docs.vagrantup.com/v2/installation/)

Go here to create a Vagrant Cloud/Atlas account: [Vagrant Cloud](https://atlas.hashicorp.com/boxes/search?utm_source=vagrantcloud.com&vagrantcloud=1)





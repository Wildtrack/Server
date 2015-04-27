#Wildtrack Docker Deploy Server

For this milestone we added an alternative deployment method.  This deployment strategy deploys Docker boxes to AWS Elastive Beanstalk.  Additionally we have removed the Vagrant setup that we used as our base server throughout the semester.  That has been replaced by a Digital Ocean droplet as will be described below.

##Setup

###Prerequisites

- Ansible on your local machine, install information is [here](http://docs.ansible.com/intro_installation.html)

###Build

The benefit of changing to a cloud based server is that the server only needs to be built and provisioned occasionally, where the vagrant setup we had originally needed to be brought up and down each time we used it.  Furthermore, we needed to update our git hooks over and over again to reflect the changing urls that vagrant assigns.  

Should whoever is doing this need help in getting keys or in setting up an ssh key that is described in depth in the readme on the Deploy branch.  

In your local machine set the following exports:

	export DO_API_TOKEN=xxxxxxxxxxxx
	export DO_API_KEY=xxxxxxxxxxxxx
	export DO_CLIENT_ID=xxxxxxxxxxxxxx
	export CLOUD_FLARE=xxxxxxxxxxxxxxx

Clone our repo:

	git clone https://github.com/Wildtrack/Server.git

Switch to the correct branch:
	
	cd Server
	git checkout dockerDeploy

Run the Ansible script to bring the server online:

	cd data
	ansible-playbook -i ./scriptor/hosts/digital_ocean.py ./scriptor/create_server.yml

This could fail just because of an ssh time out, if it does simply rerun it.  

Now if the monitoring box and proxy are not online bring them up with the following two commands: 

	ansible-playbook -i ./scriptor/hosts/digital_ocean.py ./scriptor/create_monitor.yml
	ansible-playbook -i ./scriptor/hosts/digital_ocean.py ./scriptor/create_proxy.yml

These two scripts take a very long time to run.  They may take more than 15 mintues each.  These two boxes have been up for a long period of time and using this system for production would likely never be taken down unless in need of maintenence.  Tugboat is a very easy way to check which droplets are currently running.  All of its setup is described in depth in the deploy branch.  If Tugboat is installed simply run:

	tugboat droplets

This will give a list of all existing droplets.

At this point the server is completely provisioned and the dns information is set to server.lodr.me.  To ssh run the following:

	ssh root@server.lodr.me

Login in to dockerhub

	sudo docker login
	name: wildtrack
	password: wildtrack
	e-mail: (hit return)

There are two docker deploy folders in /data
	
	liveDockerDeploy/
	canaryDockerDeploy/
	
Change to each folder and run:

	eb init
	(Enter AWS Access Key ID, this should only happen once)
	(Enter AWS Secret Access Key, this should only happen once)
	Select Region: 1
	(hit no for ssh return for everything else)

Then in each folder run:

	eb create
	(hit no for ssh and return for everything else)
	
Then launch the server from data/

	sudo node server.js
	
To use the build server we added [server.lodr.me](server.lodr.me) to a github webhook.  It also hosts the UI for our buildserver keeping a record of our build histories.

Once a build is triggered by a commit it will be pushed either to the live server or canary server based on the commit message.  If canary is in the commit message than it's commited to canary otherwise it's commited to live.

After the build and test like previous milestones, the build in the test environment is commited to a docker image.  The app server is then automatically launched in the docker image and that container is commited again.  This image is then pushed to [https://hub.docker.com/u/wildtrack/](https://hub.docker.com/u/wildtrack/).  

A Dockerrun.aws.json is updated with the image name.  This is automatically deployed to AWS elatic beanstalk using the EB CLI.  Elastic beanstalk pulls the docker image and launches it with the app's server already running.  
	







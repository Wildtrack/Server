#Wildtrack Docker Deploy Server

For this milestone we added an alternative deployment method.  This deployment strategy deploys Docker boxes to AWS Elastive Beanstalk.

##Setup
After brining up the vagrant box

	vagrant up
	vagrant ssh

Install EB CLI
	
	sudo pip install awsebcli

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
	
	







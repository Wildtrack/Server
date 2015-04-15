#Wildtrack Build and Deploy Server

##Setup
Setup is very similar to the server setup for both milestones 1 and 2. The information below is a carryover from M2 with a few changes.

##Prerequisites:  
Requires Ansible and Vagrant.  Installation information is in the notes below.  If any of the directions are unclear please check the Master branch README.

#Build

To build the project first clone the project and go to project directory and run:

	vagrant up

Screenshot of response from command:
![VagrantUp](https://github.com/Wildtrack/Server/blob/master/img/VagrantUp.png)

Note that Vagrant up takes a LONG TIME.  Don't CRTL-C, the script is working even if it seems like it's not.  The script will download the needed vagrant box, install everything that it needs, and pull the image for the Docker buildbox, so if it's the first time you've run it, it takes awhile.

Next run:

	vagrant ssh

Screenshot of response from command:
![VagrantSSH](https://github.com/Wildtrack/Server/blob/master/img/VagrantSSH.png)

In the vagrant box run:
	
	su root

The stock vagrant password is "vagrant".  

Unfortunately with our current setup you will need to have an account with Digital Ocean with a valid credit card number.  So given that we are not providing access credentials here in the README.md file.  Should the teaching staff care to see a demo we will certainly be happy to demo the software with live keys.  

If you were going to run the software with the correct access and accounts you would do the following:  
- First go the Digital Ocean website click the API link and click Generate New Token.  Record the token information.  This is DO_API_TOKEN.  

- Near the top of the page is a link for view API v1, click that.  Generate a new key and save the information for ClientID and API Key.  

These two correspond to DO_CLIENT_ID and DO_API_KEY.  Then on the vagrant box run the following commands placing in the key information from Digital Ocean:

	export DO_API_TOKEN=xxxxxxxxxxxx
	export DO_API_KEY=xxxxxxxxxxxxx
	export DO_CLIENT_ID=xxxxxxxxxxxxxx
	export CLOUD_FLARE=xxxxxxxxxxxxxxx
	cd data/
	npm install
	

If you already have a private key with a public pair that is on Digital Ocean's servers you can skip the next few steps.  The next few commands should be run on your local machine.  First create a key pair:

	ssh-keygen -t rsa

Use all of the defaults unless you know what you're doing.  Run the following commands:

	nano /home/<yourusername>/.ssh/id-rsa.pub

Copy down that information and then go to the Digital Ocean dashboard.  Hit the button as if you're going to create a new droplet.  At the bottom of the page is a link to add a new ssh key.  Click the button, put in the key, and use a name for it that you will remember.  Then run this command:

	cp /home/<yourusername>/.ssh/id_rsa <pathtothedatafolder>/data/id_rsa

Back on the vagrant box run the following commands:
	
	cd data
	cp id_rsa ~/.ssh/id_rsa
	chmod 600 ~/.ssh/id_rsa

The vagrant up command provisions the vagrant box with a Digital Ocean specific tool called tugboat.  Information on the tool can be found [here](https://github.com/pearkes/tugboat).  You will run the following command which brings up the output shown below.  Answers to each prompt are typed in, if there is no answer accept the default:

	$ tugboat authorize
	Enter your client key: <YOUR CLIENT ID> 
	Enter your API key:  <YOUR API KEY>
	Enter your SSH key path (optional, defaults to ~/.ssh/id_rsa):
	Enter your SSH user (optional, defaults to jack): root
	Enter your SSH port number (optional, defaults to 22):

	To retrieve region, image, size and key ID's, you can use the corresponding tugboat command, such as `tugboat images`.
	Defaults can be changed at any time in your ~/.tugboat configuration file.

	Enter your default region ID (optional, defaults to 1 (New York)): 8 
	Enter your default image ID (optional, defaults to 350076 (Ubuntu 13.04 x64)): 11388420
	Enter your default size ID (optional, defaults to 66 (512MB)):
	Enter your default ssh key ID (optional, defaults to none):

	Authentication with DigitalOcean was successful!

Note that we've left the ssh key ID blank.  The reason for this is that we need tugboat to actually get this information.  After authorize is complete run the following command:

	tugboat keys

The output will list the keys associated with your account.  Pick the one the you added to Digital Ocean earlier.  Then change line 12 in these files: 

- <PATH TO THE DATA DIRECTORY>/data/scriptor/create_live.yml 
- <PATH TO THE DATA DIRECTORY>/data/scriptor/create_canary.yml
- <PATH TO THE DATA DIRECTORY>/data/scriptor/create_proxy.yml 
- <PATH TO THE DATA DIRECTORY>/data/scriptor/create_monitor.yml    


The line looks like this: 
	
	droplet_ssh_keys: <YOUR KEY ID>


Additonally this software requires a domain name being routed with [Cloudflare](https://www.cloudflare.com/).  Once you have a domain set up with cloudflare you'll need to create 4 routes, one is the route for the main site that is whatever your domain is, for us it is lodr.me.  We then have three subdomains to set:  eye, kronos, and thanatos.  Use any random ip at this point for each route.  Go to the account link and copy your api key. Then run the following bash script:

	curl https://www.cloudflare.com/api_json.html \
	  -d a=rec_load_all \
	  -d tkn=<YOUR CLOUD FLARE TOKEN> \
	  -d email=<YOUR EMAIL> \
	  -d z=<YOUR DOMAIN NAME>

This generates an ugly block of json, so pipe it into a file and then copy and paste it [here](http://jsonviewer.stack.hu/).  You'll need to pull out the ids for each of the routes that are generated.  Each json block looks like this:

          "rec_id": <THE VALUE WE WANT>,
          "rec_hash": "d0fcd89c404637ef8ff78da38751c1c1",
          "zone_name": "lodr.me",
          "name": "lodr.me",
          "display_name": "lodr.me",
          "type": "A",
          "prio": null,
          "content": "104.236.73.155",
          "display_content": "104.236.73.155",
          "ttl": "1",
          "ttl_ceil": 86400,
          "ssl_id": "1492605",
          "ssl_status": "V",
          "ssl_expires_on": null,
          "auto_ttl": 1,
          "service_mode": "0",
          "props": {
            "proxiable": 1,
            "cloud_on": 0,
            "cf_open": 1,
            "ssl": 1,
            "expired_ssl": 0,
            "expiring_ssl": 0,
            "pending_ssl": 0,
            "vanity_lock": 0

"rec_id" is the value that we need for each of our four routes.  You will make a change in these four files:  

- <PATH TO THE DATA DIRECTORY>/data/scriptor/eyedns.sh
- <PATH TO THE DATA DIRECTORY>/data/scriptor/proxydns.sh
- <PATH TO THE DATA DIRECTORY>/data/scriptor/kronosdns.sh 
- <PATH TO THE DATA DIRECTORY>/data/scriptor/thanatosdns.sh 

The block we will change is the following:

    curl https://www.cloudflare.com/api_json.html \
      -d a=rec_edit \
      -d tkn=$CLOUD_FLARE \
      -d email=<YOUR_EMAIL> \
      -d z=<YOUR DOMAIN NAME> \
      -d id=<ID OF THE ROUTE> \
      -d type=A \
      -d name=<NAME OF THE ROUTE> \
      -d ttl=1 \
      -d "content=$WAN_IP"
    echo $WAN_IP > /var/CURRENT_WAN_IP.txt

You'll need to change your email, the domain name, id of the route, and name of the route.  The tkn line is set through an environment variable.  All of the cloudflare related setup is also described [here](http://kevo.io/code/2012/11/07/cloudflare-dynamic-dns/)

Now everything is completely set up.  The big thing here is that creating the key pair only needs to be done once, setting line 12 in the four .yml files only needs to be done once, and finally setting the values in cloudflare only needs to be done once.  Before running the server two ansible scripts must be run from the data directory:

	ansible-playbook -i ./scriptor/hosts/digital_ocean.py ./scriptor/create_monitor.yml
	ansible-playbook -i ./scriptor/hosts/digital_ocean.py ./scriptor/create_proxy.yml

These two scripts take a very long time to run.  They may take more than 15 mintues each.  The good thing with this is that these only need to be run once and then we can leave the two boxes up as part of our infrastructure.  The create_monitor script brings up a box called odin and the create_proxy script brings up a box called cerberus.  Each will be described in much more detail later.

Since everything is set now you will run:

	node server2.js

This entire setup requires being logged in as root now because there is a conflict between [docker-exec](https://www.npmjs.com/package/docker-exec) and the dynamic inventory that we are using to provision with ansible.  Previously this command was run with sudo.
	
In the host OS go to this [URL](http://localhost:2234) to test to see if the server is running.

In the host OS, go to the project directory and run:
	
	vagrant login

Log in the Vagrant Cloud/Atlas name and password.  Then run:

	vagrant share

A url will be displayed after vagrant share has run, a screenshot is below:

![VagrantShare](https://github.com/Wildtrack/Server/blob/Test/img/VagrantShare.png)	

Once the server is up and vagrant share has been run the server state is visible at the vagrant share address.  This is our revamped UI.  The buttons at the top of the page are currently placeholders.  The bar on the left will populate with ISOstring dates matching the builds when they are triggered from a git webhook.  The fields will populate with the results of the build when the build selected on the left.

Screenshot of the initial state of the server:

![InitialState](https://github.com/Wildtrack/Server/blob/Test/img/InitialState.png)

We are building a different project at this point.  The webhook should be added [here](https://github.com/Wildtrack/maze/settings/hooks/new).  There is an image of adding the webhook below: 

![Webhook](https://github.com/Wildtrack/Server/blob/master/img/Webhook.png)

Push to the repo, or use the redeliver button to trigger a build.  The image below shows the redeliver button.

![Redeliver](https://github.com/Wildtrack/Server/blob/master/img/Redeliver.png)

Once the webhook has been added the server will be immediately pinged as if a commit had been made.  The build reports are given in order from oldest to newest on the left side of the page in blue.  Upon clicking the date and time the full report is given. 

All test related information has been pulled from this readme, but is located on the testing branch.

Whenever you are done with the server run:

	vagrant destroy

Screenshot of response from command:
![VagrantDestroy](https://github.com/Wildtrack/Server/blob/master/img/VagrantDestroy.png)

You will also want to destroy all of the active Digital Ocean droplets since they will be out there costing money unless you actually need everything to stay live.  Destroying droplets can be accomplished either in the Digital Ocean dash or by using 

	tugboat destroy <NAME OF THE NODE TO KILL>

The list of running droplets can be found by running:

	tugboat droplets


##Infrastructure

This section will describe exactly what our structure is with this project.  In the image below and as discussed above you will notice that we have 4 droplets in our system.  

![sysdiag](https://github.com/Wildtrack/Server/blob/Deploy/img/sysDiag.png)

The droplets function as follows:

####Odin
This droplet is also called eye, and is our monitoring node.  When set up it is accessible at eye.lodr.me/nagios.  An image of the main dash is below:

![maindash](https://github.com/Wildtrack/Server/blob/Deploy/img/maindash.png)

This droplet has a connection to all of the other droplets in the system and also monitors itself.  It is set up using [nagios](http://www.nagios.org/).  This is a fairly heavyweight tool that can keep track of a wide variety of information on nodes.  Currently we are logging just a small fraction of what we could but in the image below you can see how the setup looks with all of the nodes created and running:

![allnodes](https://github.com/Wildtrack/Server/blob/Deploy/img/allnodes.png)

Going into thanatos, which will be described later, we have data on ping, latency, whether the host is up or not, when the state of the node last changed, and finally in another window whether ssh on the particular box is available or not.  This information is shown in the following two images:


![thanatosmaindash](https://github.com/Wildtrack/Server/blob/Deploy/img/thanatosmaindash.png)

![thanatosdetail](https://github.com/Wildtrack/Server/blob/Deploy/img/thanatosdetail.png)


There is also a large amount of information on the actual service state of the machine over time for both ssh and ping.  The image below shows a histogram of the state on the ssh service.  Obviously alot of the time this box has been down as the team didn't want to pay for it to be up all of the time, also the actual nagios monitoring box has been up and down serveral times so it has not been monitoring for long enough for this infomration to be very valuable.

![thanatosssh](https://github.com/Wildtrack/Server/blob/Deploy/img/thanatosssh.png)

####Cerberus

This is our proxy box.  It is located at the root domain and can be accessed at either http://www.lodr.me or http://lodr.me.  This proxy routes all traffic to thanatos.lodr.me most of the time.  If this route is accessed: http://www.lodr.me/canary.  The proxy switches over into a canary mode.  This way individual IP addresses are routed to either thanatos.lodr.me, or kronos.lodr.me according to a set percentage of the time.  


####Thanatos

This is the live deploy box.  It is located at thanatos.lodr.me.  Most builds will be deployed here.  

####Kronos

This is the canary deploy box.  It is located at kronos.lodr.me.


##Deployment modes

In normal operation all builds are deployed to thanatos according to an ansible script and cerberus routes all traffic to thanatos.lodr.me.  This works the same as the server did originally with a git hook.  On a hook the server runs the build routine, and then the ansible script runs as follows:

  - If there is an old deployment that is live that deployment is destroyed
  - A fresh droplet is brought online
  - The droplet is provisioned as required for the maze project
  - The project is pulled from github and all dependencies are generated
  - The ip of the droplet is dynamically associated with the relevant subdomain
  - Forever starts a simple webserver in the droplet to run the maze game

There are two images below.  The first is the maze game running on thanatos.lodr.me, and the second is the maze game running on lodr.me.  The second just shows traffic routed to thanatos.lodr.me.

![livebuildthan](https://github.com/Wildtrack/Server/blob/Deploy/img/livebuildthan.png)

![livebuildlodr](https://github.com/Wildtrack/Server/blob/Deploy/img/livebuildlodr.png)


Canary operation is switched on by making a commit to the monitored github repo with the message "canary". This assumes that a live build has already been pushed and thanatos is already running.  There are a few simple differences here: 

  - If there is an old canary build in kronos it is destroyed, but nothing happens to the live build in thanatos
  - After forever runs, the vagrant server issues a get to the following url:  http://lodr.me/canary

Now the canary is deployed and the live build is deployed and traffic is routed between the two as described in the section on Cerberus.  To attempt to show that the proxy is functioning we made a slight change to the normal deploy.  In the console each button in the maze game dash just prints out what the button does.  As shown below:

![mazebuttons](https://github.com/Wildtrack/Server/blob/Deploy/img/mazebuttons.png)

When the change is made and the push is made using the canary message as shown in this image:

![canarycommit](https://github.com/Wildtrack/Server/blob/Deploy/img/canarycommit.png)

Going to lodr.me after the change the canary is in effect.  50% of the time we should get the canary, and visiting the site we do as shown in the image below:

![canarybuttons](https://github.com/Wildtrack/Server/blob/Deploy/img/canarybuttons.png)

To turn off the canary feature simply push a new normal commit without the canary message.

##Problems with the system
We have run into some issues with Digital Ocean for this project.  Occassionally we encounter errors where no matter how long we wait to connect to the new droplet via ssh the connection never goes through.  

That could be dealt with by having Droplets that are up continuously and deleting their contents on each deploy, but that seems to run into territory where you are uncertain whether a box has been fully cleaned when a new deploy takes place, where our current system does not run into that issue.  This represents a trade off because the ssh issue is not easily reproducible and certainly does not happen on each deploy, and may well not happen on every 10 deploys, but it is possible for it to occur.

##Notes

Adding a URL to the repo will not be possible for teaching staff before they are added to the organization.  Just email one of us and we can add you to the organization.  For this specific usecase it is a bit problematic, but in most situations the only users of a buildbox would already be members of the github organization.  Anyway, sorry for the inconvienence.

Ansible install:  The install information is [here](http://docs.ansible.com/intro_installation.html).  

Vagrant install:  The install information is [here](https://docs.vagrantup.com/v2/installation/)

Go here to create a Vagrant Cloud/Atlas account: [Vagrant Cloud](https://atlas.hashicorp.com/boxes/search?utm_source=vagrantcloud.com&vagrantcloud=1)

##Evaluation

- The ability to configure a deployment environment automatically, using a configuration management tool, such as ansible, or configured using vagrant/docker.  Builds are provisioned using Ansible

- The ability to deploy a self-contained/built application to the deployment environment. That is, this action should occur after a build step in your pipeline.  Build occurs on Vagrant server for testing purposes.  Npm install is run on the remote box after a git pull and the server is brought up.  This is never done unless the build actually passes on the vagrant server.

- The deployment must occur on an actual remote machine/VM (e.g. AWS, droplet, VCL), and not a local VM.  Deployment is on Digital Ocean.

- The ability to performa a canary release.  Done on the Kronos deploy box and described above.

- The ability to monitor the deployed application for alerts/failures (using at least 2 metrics).  We are measuring latency, up time, and ssh being open or closed using Nagios.





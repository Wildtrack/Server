#Scriptor

This repo contains a ton of digital ocean related scripts.  To use them you need to set your environment variables to include your digital ocean information, for whatever reason this requires both v1 and v2 tokens:

    export DO_API_KEY=xxxxxxxxxxxxxxx
    export DO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
    export DO_API_TOKEN=xxxxxxxxxxxxxxxxxxxx
    export CLOUD_FLARE=xxxxxxxxxxxxxxxxxxxxx





There are three scripts.  One for setting up a canary, one for a proxy and one for a live node.  They are all run in essentially the same way:

	ansible-playbook -i ./hosts/digital_ocean.py create_canary.yml

Just swap out canary for live or proxy.  Additionally there is a chunk of code in main.js that can be used to provision droplets.  There are two constants on lines 3 and 4 that will need to be set with the api key values.

The create_monitor script creates a nagios box per this [link](https://www.digitalocean.com/community/tutorials/how-to-install-nagios-4-and-monitor-your-servers-on-ubuntu-14-04).    

The lamp part of the install script is based on the script [here](http://configure.systems/series-ansible-lamp-stack-mysql-secure-installation-p3/).

Added port checking in create_monitor, but it's not working quite correctly yet.  If there is a failure in any of these ansible scripts at GATHERING FACTS, simply rerun the script.
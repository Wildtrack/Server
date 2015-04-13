#!/bin/sh
#Dynamic DNS script from http://kevo.io/code/2012/11/07/cloudflare-dynamic-dns/
WAN_IP=`wget -O - -q http://ifconfig.me/ip`
OLD_WAN_IP=`cat /var/CURRENT_WAN_IP.txt`
if [ "$WAN_IP" = "$OLD_WAN_IP" ]
then
        echo "IP Unchanged"
else
        curl https://www.cloudflare.com/api_json.html \
          -d a=rec_edit \
          -d tkn=$CLOUD_FLARE \
          -d email=meneal@gmail.com \
          -d z=lodr.me \
          -d id=262508974 \
          -d type=A \
          -d name=kronos \
          -d ttl=1 \
          -d "content=$WAN_IP"
        echo $WAN_IP > /var/CURRENT_WAN_IP.txt
fi
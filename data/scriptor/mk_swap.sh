dd if=/dev/zero of=/swap bs=1024 count=2097152
mkswap /swap && sudo chown root. /swap && sudo chmod 0600 /swap && sudo swapon /swap
sh -c "echo /swap swap swap defaults 0 0 >> /etc/fstab"
sh -c "echo vm.swappiness = 0 >> /etc/sysctl.conf && sysctl -p"

#!/bin/bash

set -eou pipefail

# MAIN SETUP SCRIPT FOR MOPO PINBALL

apt update
apt install -y mosquitto uuid figlet

# Automate some settings in raspi-config https://raspberrypi.stackexchange.com/a/66939
locale=en_US.UTF-8
layout=us
raspi-config nonint do_change_locale $locale
raspi-config nonint do_configure_keyboard $layout
randomid=$(uuid)
hostname=mopo-${randomid:0:8}
raspi-config nonint do_hostname $hostname
raspi-config nonint do_ssh 1
raspi-config nonint do_i2c 1

# Run the following script as the "pi" user.
curl https://raw.githubusercontent.com/mopopinball/engine/beta/setup/pi.sh > ./pi.sh
chmod +x ./pi.sh
sudo -H -u pi ./pi.sh

export NVM_DIR="/home/pi/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Allow node to start webserver on port 80
setcap 'cap_net_bind_service=+ep' $(nvm which current)

# Create systemd service
cp /home/pi/mopo/engine/setup/mopo.service /lib/systemd/system/mopo.service

# Setup mosquitto with MQTT, web sockets, etc.
cp /home/pi/mopo/engine/setup/mosquitto.conf /etc/mosquitto/conf.d/myconfig.conf

figlet Mopo Pinball >> /etc/motd
'See https://github.com/mopopinball for documentation.' >> /etc/motd

systemctl enable mopo

echo "The system must now restart. [Y/n]? "
read CONFIRM
if [ $CONFIRM == 'n']; then
    exit 1
else
    reboot now
fi
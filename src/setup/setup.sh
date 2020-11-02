#!/bin/bash

set -eou pipefail

# MAIN SETUP SCRIPT FOR MOPO PINBALL

apt update
apt install -y wiringpi mosquitto uuid figlet

# Automate some settings in raspi-config https://raspberrypi.stackexchange.com/a/66939
locale=en_US.UTF-8
layout=us
raspi-config nonint do_change_locale $locale
raspi-config nonint do_configure_keyboard $layout
randomid=$(uuid)
hostname=mopo-${randomid:0:8}
raspi-config nonint do_hostname $hostname
raspi-config nonint do_ssh 1
rsapi-config nonint do_i2c 1

# Run the following script as the "pi" user.
sudo -H -u pi ./pi.sh

export NVM_DIR="/home/pi/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Allow node to start webserver on port 80
setcap 'cap_net_bind_service=+ep' $(nvm which current)

# Create systemd service
cp ./mopo.service /lib/systemd/system/mopo.service
systemctl enable mopo

# Setup mosquitto with MQTT, web sockets, etc.
cp ./mosquitto.conf /etc/mosquitto/conf.d/myconfig.conf

figlet Mopo Pinball >> /etc/motd
'See https://github.com/mopopinball for documentation.' >> /etc/motd
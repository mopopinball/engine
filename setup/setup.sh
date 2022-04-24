#!/bin/bash

set -eou pipefail

# MAIN SETUP SCRIPT FOR MOPO PINBALL

apt update
apt install -y mosquitto uuid figlet git

git clone https://github.com/WiringPi/WiringPi.git
pushd WiringPi
./build
popd
gpio -v

# Automate some settings in raspi-config https://raspberrypi.stackexchange.com/a/66939
# raspi-config nonint do_ssh 1
# raspi-config nonint do_i2c 1
randomid=$(uuid)
hostname=mopo-${randomid:0:8}
raspi-config nonint do_hostname $hostname

# SSH seems to have issues quite often (TODO: confirm prevalence), try to correct it.
# See https://discourse.osmc.tv/t/solved-ssh-connection-sometimes-hangs/76504/4 for more info.
echo 'IPQoS cs0 cs0' >> /etc/ssh/sshd_config

# Run the following script as the "pi" user.
curl https://raw.githubusercontent.com/mopopinball/engine/beta/setup/pi.sh > ./pi.sh
chmod +x ./pi.sh
sudo -H -u pi ./pi.sh

export NVM_DIR="/home/pi/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Allow node to start webserver on port 80
FOUND_NODE=$(nvm which current)
echo "Using node at $FOUND_NODE"
setcap 'cap_net_bind_service=+ep' $FOUND_NODE

# PIC programmer
echo Installing the PIC programmer.
mkdir /tmp/picpgm_install
cd /tmp/picpgm_install
wget http://picpgm.picprojects.net/download/picpgm-2.9.3.1-linux-armhf.tar.gz
tar xzvf picpgm-2.9.3.1-linux-armhf.tar.gz
./install.sh
sudo -H -u pi cp /home/pi/mopo/engine/setup/pgmifcfg.xml /home/pi/pgmifcfg.xml

# Create systemd service
cp /home/pi/mopo/engine/setup/mopo.service /lib/systemd/system/mopo.service
sed -i "s|NODEPATH|$FOUND_NODE|g" /lib/systemd/system/mopo.service

# Setup mosquitto with MQTT, web sockets, etc.
cp /home/pi/mopo/engine/setup/mosquitto.conf /etc/mosquitto/conf.d/myconfig.conf

cp /home/pi/mopo/engine/setup/motd /etc/motd

systemctl enable mopo

# cleanup
rm /home/pi/pi.sh

reboot now
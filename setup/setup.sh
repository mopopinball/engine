#!/bin/bash

set -eou pipefail

# MAIN SETUP SCRIPT FOR MOPO PINBALL

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo reboot now
wget https://raw.githubusercontent.com/mopopinball/engine/master/setup/mosquitto.conf -O mosquitto.conf
sudo docker run --name=mqtt -d --restart always -p 1883:1883 -p 9001:9001 -v ./mosquitto.conf:/mosquitto/config/mosquitto.conf eclipse-mosquitto
sudo docker pull ghcr.io/mopopinball/engine:master
mkdir /home/pi/mopo-data
sudo docker run --name=mopo -d --privileged --network=host --restart always -v /home/pi/mopo-data:/app/data ghcr.io/mopopinball/engine:master
echo Navigate to http://127.0.0.1:1983 to complete the installation.
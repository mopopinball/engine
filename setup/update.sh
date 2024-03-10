#!/bin/bash

set -eou pipefail

# UPDATES TO THE LATEST VERSION OF MOPO PINBALL
echo Updating Mopo Pinball

sudo docker pull ghcr.io/mopopinball/engine:master
sudo docker kill mopo
sudo docker rm mopo
sudo docker run --name=mopo -d --privileged --network=host --restart always -v /home/pi/mopo-data:/app/data ghcr.io/mopopinball/engine:master
#!/bin/bash

set -eou pipefail

# UPDATES TO THE LATEST VERSION OF MOPO PINBALL
echo Updating Mopo Pinball

# ENGRELEASE=https://github.com/mopopinball/engine/releases/latest/download/dist.tar.gz
# MENURELEASE=https://github.com/mopopinball/service-menu/releases/latest/download/dist.tar.gz
# PICSRELEASE=https://github.com/mopopinball/pics/releases/latest/download/dist.tar.gz
# DIR=/tmp/mopo-update

# echo Downloading the engine
# wget $ENGRELEASE -O mopo.tar.gz
# rm -rf $DIR
# mkdir $DIR
# tar xf mopo.tar.gz -C $DIR --strip-components=2
# rm mopo.tar.gz
# rsync -r --delete --exclude=node_modules --verbose $DIR/ /home/pi/mopo/engine
# rm -rf $DIR
# echo Installing the engine...
# npm ci --production --prefix /home/pi/mopo/engine

# echo Downloading the service menu
# wget $MENURELEASE -O menu.tar.gz
# rm -rf $DIR
# mkdir $DIR
# tar xf menu.tar.gz -C $DIR --strip-components=2
# rm menu.tar.gz
# rsync -r --delete --exclude=node_modules --verbose $DIR/ /home/pi/mopo/servicemenu
# rm -rf $DIR

# echo Downloading PICs
# wget $PICSRELEASE -O pics.tar.gz
# rm -rf $DIR
# mkdir $DIR
# tar xf pics.tar.gz -C $DIR --strip-components=4
# rm pics.tar.gz
# rsync -r --delete --exclude=node_modules --verbose $DIR/ /home/pi/mopo/pics/available
# rm -rf $DIR

sudo docker pull ghcr.io/mopopinball/engine:master
sudo docker kill mopo
sudo docker rm mopo
sudo docker run --name=mopo -d --privileged --network=host --restart always -v /home/pi/mopo-data:/app/data ghcr.io/mopopinball/engine:master
#!/bin/bash

# SETUP SCRIPT FOR THE "pi" USER

# Node and NVM
echo Installing Node via nvm.
ARMV6_NODE_VERSION=10
ARMV7_NODE_VERSION=12

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
ARM_V6=$(cat /proc/cpuinfo | grep -c ARMv6)
ARM_V7=$(cat /proc/cpuinfo | grep -c ARMv7)
if [ $ARM_V6 -gt 0 ]
then
    nvm install $ARMV6_NODE_VERSION
    nvm alias default $ARMV6_NODE_VERSION
elif [ $ARM_V7 -gt 0 ]
then
    nvm install $ARMV7_NODE_VERSION
    nvm alias default $ARMV7_NODE_VERSION
else
    echo Invalid ARM version
    exit 1
fi

# # PIC programmer
# echo Installing the PIC programmer.
# cd ~
# mkdir picpgm_install
# cd picpgm_install
# wget http://picpgm.picprojects.net/download/picpgm-2.9.3.1-linux-armhf.tar.gz
# tar xzvf picpgm-2.9.3.1-linux-armhf.tar.gz
# sudo ./install.sh
# # cp pgmifcfg.xml ~
# rm -rf picpgm_install
# cd ~
# cd /tmp
# wget http://wiki.kewl.org/downloads/pickle-4.20.tgz 
# tar zxf pickle-4.20.tgz 
# cd pickle-4.20/
# make
# sudo make install

# cd ~
# cat > .pickle <<EOF
# DEVICE=RPI2
# SLEEP=1
# BITRULES=0x4F00
# VPP=24
# # set PGM = -1 if not used, otherwise use the correct pin number below
# PGM=-1
# PGC=23
# PGD=27
# EOF
# /home/pi/mopo/engine/setup/pgmifcfg.xml /home/pi/pgmifcfg.xml

# Download Mopo, npm install it and setup the game.
mkdir -p /home/pi/mopo/engine
curl https://raw.githubusercontent.com/mopopinball/engine/beta/setup/update.sh | bash

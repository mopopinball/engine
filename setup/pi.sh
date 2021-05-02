    #!/bin/bash

set -eou pipefail

# SETUP SCRIPT FOR THE "pi" USER

# Node and NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
ARM_V6=$(cat /proc/cpuinfo | grep ARMv6)
ARM_V7=$(cat /proc/cpuinfo | grep ARMv7)
if [ ${#ARM_V6} -gt 0 ]
then
    nvm install 10.23.0
    nvm alias default 10.23.0
elif [ ${#ARM_V7} -gt 0 ]
then
    nvm install 12.19.0
    nvm alias default 12.19.0
else
    echo Invalid ARM version
    exit 1
fi

# PIC programmer
cd ~
mkdir picpgm_install
cd picpgm_install
wget http://picpgm.picprojects.net/download/picpgm-2.9.1.0-linux-armhf.tar.gz
tar xzvf picpgm-2.9.1.0-linux-armhf.tar.gz
sudo ./install.sh
cp pgmifcfg.xml ~
rm -rf picpgm_install
cd ~

# TODO: Download mopo, npm install it and setup the game.
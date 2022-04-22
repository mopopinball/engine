#!/bin/bash
set -e

if [[ $UID != 0 ]]; then
    echo "Please run this script with sudo:"
    echo "sudo $0 $*"
    exit 1
fi

echo Select which PIC to program [s]Switches [d]Displays [r]Drivers

read PIC

echo Stopping Mopo Pinball
systemctl stop mopo

mkdir -p /home/pi/mopo/pics

echo Press [Enter] when the JUMPERS are installed
read

pushd /home/pi

if [ $PIC == 's' ]
then
    picpgm -p /home/pi/mopo/engine/pics/mopo-switches.production.hex
    cp /home/pi/mopo/engine/pics/switches-version.json /home/pi/mopo/pics/switches-version.json
    chown pi /home/pi/mopo/pics/switches-version.json
elif [ $PIC == 'd' ]
then
    picpgm -p /home/pi/mopo/engine/pics/mopo-displays.production.hex
    cp /home/pi/mopo/engine/pics/displays-version.json /home/pi/mopo/pics/displays-version.json
    chown pi /home/pi/mopo/pics/displays-version.json
elif [ $PIC == 'r' ]
then
    picpgm -p /home/pi/mopo/engine/pics/mopo-driver.production.hex
    cp /home/pi/mopo/engine/pics/driver-version.json /home/pi/mopo/pics/driver-version.json
    chown pi /home/pi/mopo/pics/driver-version.json
else
    exit 1
fi

popd

echo Press [Enter] when the JUMPERS are removed
read

echo Starting Mopo Pinball...
systemctl start mopo

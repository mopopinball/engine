#!/bin/bash
set -e

echo Select which PIC to program [s]Switches [d]Displays [r]Drivers

read PIC

echo Stopping Mopo Pinball
systemctl stop mopo

mkdir -p /home/pi/mopo/pics

echo Press [Enter] when the JUMPERS are installed
read

if [ $PIC == 's' ]
then
    sudo picpgm -p pics/mopo-switches.production.hex
    cp /home/pi/mopo/engine/pics/switches-version.json /home/pi/mopo/pics/switches-version.json
elif [ $PIC == 'd' ]
then
    sudo picpgm -p pics/mopo-displays.production.hex
    cp /home/pi/mopo/engine/pics/displays-version.json /home/pi/mopo/pics/displays-version.json
elif [ $PIC == 'r' ]
then
    sudo picpgm -p pics/mopo-driver.production.hex
    cp /home/pi/mopo/engine/pics/driver-version.json /home/pi/mopo/pics/driver-version.json
else
    exit 1
fi

echo Press [Enter] when the JUMPERS are removed
read

echo Starting Mopo Pinball...
systemctl start mopo

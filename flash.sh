#!/bin/bash
set -e

echo Select which PIC to program [s]Switches [d]Displays [r]Drivers

read PIC

echo Stopping Mopo Pinball
systemctl stop mopo

echo Press [Enter] when the jumpers are installed
read

if [ $PIC == 's' ]
then
    ./flash_sw.sh
elif [ $PIC == 'd' ]
then
    ./flash_disp.sh
elif [ $PIC == 'r' ]
then
    ./flash_dr.sh
else
    exit 1
fi

echo Press [Enter] when the jumpers are removed
read

echo Starting Mopo Pinball...
systemctl start mopo

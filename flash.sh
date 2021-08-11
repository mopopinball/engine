#!/bin/bash
set -e

echo Select which PIC to program [S]Switches [D]Displays [R]Drivers

read PIC

echo Stopping mopo
systemctl stop mopo

echo Press [Enter] when the jumpers are installed
read

if [ $PIC == 'S' ]
then
    ./flash_sw.sh
elif [ $PIC == 'D' ]
then
    ./flash_disp.sh
elif [ $PIC == 'R' ]
then
    ./flash_dr.sh
fi

echo Press [Enter] when the jumpers are removed
read

echo Starting mopo
systemctl start mopo

#!/bin/bash
gpio unexportall
picpgm -p pics/mopo-driver.production.hex

# Record the flashing
mkdir -p /home/pi/mopo/pics
cp /home/pi/mopo/engine/pics/driver-version.json /home/pi/mopo/pics/driver-version.json
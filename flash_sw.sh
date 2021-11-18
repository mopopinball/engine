#!/bin/bash
gpio unexportall
picpgm -p pics/mopo-switches.production.hex

# Record the flashing
mkdir -p /home/pi/mopo/pics
cp /home/pi/mopo/engine/pics/switches-version.json /home/pi/mopo/pics/switches-version.json

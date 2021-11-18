#!/bin/bash
gpio unexportall
picpgm -p pics/mopo-displays.production.hex

# Record the flashing
mkdir -p /home/pi/mopo/pics
cp /home/pi/mopo/engine/pics/displays-version.json /home/pi/mopo/pics/displays-version.json

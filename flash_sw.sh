#!/bin/bash
set -e

gpio unexportall
p16 lvp program  -p pics/mopo-switches.production.hex

# Record the flashing
mkdir -p /home/pi/mopo/pics
cp /home/pi/mopo/engine/pics/switches-version.json /home/pi/mopo/pics/switches-version.json

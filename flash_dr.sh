#!/bin/bash
set -e

gpio unexportall
p16 lvp program  pics/mopo-driver.production.hex

# Record the flashing
mkdir -p /home/pi/mopo/pics
cp /home/pi/mopo/engine/pics/driver-version.json /home/pi/mopo/pics/driver-version.json
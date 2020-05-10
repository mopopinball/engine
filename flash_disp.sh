#!/bin/bash
systemctl stop mopo
gpio unexportall
picpgm -p pics/mopo-displays.production.hex

systemctl restart mopo
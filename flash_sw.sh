#!/bin/bash
systemctl stop mopo
gpio unexportall
picpgm -p pics/mopo-switches.production.hex
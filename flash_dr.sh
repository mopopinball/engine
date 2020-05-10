#!/bin/bash
systemctl stop mopo
gpio unexportall
picpgm -p pics/mopo-driver.production.hex
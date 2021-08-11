#!/bin/bash
gpio unexportall
picpgm -p pics/mopo-displays.production.hex

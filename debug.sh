#!/bin/bash

IS_MOPO_RUNNING=$(pgrep mopo --count)

if [ $IS_MOPO_RUNNING -gt 0 ]
then
    echo Mopo Pinball is already running. To stop it, run: sudo systemctl stop mopo
    exit 1
fi

DEBUG=true node --inspect=0.0.0.0 src/index
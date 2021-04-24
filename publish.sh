#!/bin/bash

set -eou pipefail

./package.sh

rsync -r --delete --exclude=hardware-config.json --exclude=gamestate-config.json --exclude=node_modules --exclude=mopo.log --verbose dist/ pi@mopo-derp:~/mopo
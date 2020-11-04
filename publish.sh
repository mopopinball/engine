#!/bin/bash

set -eou pipefail

rm -rf dist
mkdir dist

# pushd site
# ng build
# popd
# cp -r site/dist/site dist/site

tsc

# TODO: Get the pics from their latest release on GitHub.
# mkdir dist/pics
# cp pics/mopo-switches/dist/default/production/mopo-switches.production.hex dist/pics
# cp pics/mopo-driver/dist/default/production/mopo-driver.production.hex dist/pics
# cp pics/mopo-displays/dist/default/production/mopo-displays.production.hex dist/pics

# npm run lint --prefix node

# rsync -r --exclude=node_modules --exclude=test --verbose node/ dist/node

# cp -r setup/ dist/setup

cp flash_sw.sh dist
cp flash_dr.sh dist
cp flash_disp.sh dist
cp package.json dist
cp package-lock.json dist
rsync -r --verbose src/games/ dist/src/games
rsync -r --verbose setup/ dist/setup

rsync -r --delete --exclude=hardware-config.json --exclude=gamestate-config.json --exclude=node_modules --exclude=mopo.log --verbose dist/ pi@192.168.1.29:~/mopo
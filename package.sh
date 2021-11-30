#!/bin/bash

set -eou pipefail

rm -rf dist
mkdir dist

# Install then compile the engine
npm ci
npm run tsc

# TODO: Get the pics from their latest release on GitHub.
# mkdir dist/pics
# cp pics/mopo-switches/dist/default/production/mopo-switches.production.hex dist/pics
# cp pics/mopo-driver/dist/default/production/mopo-driver.production.hex dist/pics
# cp pics/mopo-displays/dist/default/production/mopo-displays.production.hex dist/pics

# rsync -r --exclude=node_modules --exclude=test --verbose node/ dist/node

# cp -r setup/ dist/setup

# Copy additional items to the dist folder.
cp flash_sw.sh dist
cp flash_dr.sh dist
cp flash_disp.sh dist
cp flash.sh dist
cp debug.sh dist
cp select-game.sh dist
cp package.json dist
cp package-lock.json dist
rsync -r --verbose src/games/ dist/src/games
rsync -r --verbose setup/ dist/setup

tar cvzf dist.tar.gz ./dist
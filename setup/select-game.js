const fs = require('fs');
const path = require('path');
const term = require('terminal-kit').terminal;

async function run() {
    term.bold('Mopo Pinball');

    term('Select a game:');

    // resursively find all "game_manifest.json" files.
    const manifestFiles = [];

    const response = await term.singleColumnMenu(manifestFiles.map((mf) => mf.name));
    
    const configFile = fs.readFile('../config.json', 'utf-8');

}

run();

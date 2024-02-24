import { spawnSync, SpawnSyncReturns } from "child_process";
import {sync} from 'md5-file';
import {copyFileSync, existsSync} from 'fs';
import { logger } from "./logger";
import { UpdatePicDefinition } from "./update-pic-definition";

export class UpdatePics {
    private readonly displayPicDef: UpdatePicDefinition = {
        picName: 'Displays',
        path: '/home/pi/mopo/pics/mopo-displays/dist/default/production/mopo-displays.production.hex',
        appliedPath: '/home/pi/mopo/pics-applied/mopo-displays/dist/default/production/mopo-displays.production.hex'        
    }
    private readonly driverPicDef: UpdatePicDefinition = {
        picName: 'Displays',
        path: '/home/pi/mopo/pics/mopo-driver/dist/default/production/mopo-driver.production.hex',
        appliedPath: '/home/pi/mopo/pics-applied/mopo-driver/dist/default/production/mopo-driver.production.hex'        
    }
    private readonly switchesPicDef: UpdatePicDefinition = {
        picName: 'Displays',
        path: '/home/pi/mopo/pics/mopo-switches/dist/default/production/mopo-switches.production.hex',
        appliedPath: '/home/pi/mopo/pics-applied/mopo-switches/dist/default/production/mopo-switches.production.hex'        
    }

    isDisplayPicOutdated(): boolean {
        return this.isPicOutdated(this.displayPicDef);
    }

    isDriverPicOutdated(): boolean {
        return this.isPicOutdated(this.driverPicDef);
    }

    isSwitchesPicOutdated(): boolean {
        return this.isPicOutdated(this.switchesPicDef);
    }

    private isPicOutdated(definition: UpdatePicDefinition): boolean {
        if (!existsSync(definition.path) || !existsSync(definition.appliedPath)) {
            return true;
        }
        else {
            return sync(definition.path) !== sync(definition.appliedPath);
        }
    }

    programHex(definition: UpdatePicDefinition): SpawnSyncReturns<string> {
        // todo
        const result = spawnSync('picpgm', ['-p', definition.path], {stdio: 'pipe', encoding: 'utf-8'});
        logger.info(result.stdout);

        // if successful
        if (!result.status) {
            copyFileSync(definition.path, definition.appliedPath);
        }

        return result;
    }
}
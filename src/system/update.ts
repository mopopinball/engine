import axios from 'axios';
import {x} from 'tar';
import {version} from '../../package.json';
// import * as picManifest from '../../pics/package.json';
import * as semver from 'semver';
import {logger} from './logger';
import { GithubRelease } from './github-release';
import { existsSync, readFileSync } from 'fs';

const picPath = '/home/pi/mopo/pics';

export class Update {
    private readonly engineReleaseUrl = 'https://api.github.com/repos/mopopinball/engine/releases';
    private readonly serviceMenuReleaseUrl = 'https://api.github.com/repos/mopopinball/service-menu/releases'
    private readonly picsReleaseUrl = 'https://api.github.com/repos/mopopinball/auto-update/releases';
    private readonly engineOutDir = '/home/pi/mopo-test/';
    private readonly serviceMenuDir = '/home/pi/mopo-test/admin'

    private static instance: Update;

    static getInstance(): Update {
        if (!Update.instance) {
            Update.instance = new Update();
        }
        return Update.instance;
    }

    private constructor() {
        //intentionally empty
    }

    getVersion(): string {
        return version;
    }

    getPicVersion(): string {
        if (!existsSync(picPath)) {
            return '0.0.0';
        }
        const picPackage = JSON.parse(readFileSync(picPath + '/package.json', {encoding: 'utf8'}));
        return picPackage.version;
    }

    public async getAvailableSystemUpdate(prerelease: boolean): Promise<GithubRelease> {
        return this.isUpdateAvailable(this.engineReleaseUrl, prerelease, this.getVersion());
    }

    public async getAvailableServiceMenuUpdate(prerelease: boolean): Promise<GithubRelease> {
        return this.isUpdateAvailable(this.serviceMenuReleaseUrl, prerelease, '0.0.0');
    }

    public async getAvailablePicUpdate(prerlease: boolean): Promise<GithubRelease> {
        return this.isUpdateAvailable(this.picsReleaseUrl, prerlease, this.getPicVersion());
    }

    private async isUpdateAvailable(releaseUrl: string, prerelease: boolean, currentVersion: string): Promise<GithubRelease> {
        logger.info(`Running version ${currentVersion}. Checking for update.`);
        const candidates: GithubRelease[] = await (await axios.get(releaseUrl)).data;
        
        const releases = candidates.filter((r) =>
            r.prerelease === prerelease && semver.gt(r.tag_name, currentVersion)
        );
        
        if (releases.length === 0) {
            logger.info('No update found');
            return null;
        } else {
            return releases[0];
        }
    }

    public async applyUpdate(release: GithubRelease, reset: boolean): Promise<void> {
        if (release.url.indexOf('mopopinball/engine') >= 0) {
            await this.applySystemUpdate(release, reset);
        }
        else if (release.url.indexOf('mopopinball/service-menu') >= 0) {
            await this.applyServiceMenuUpdate(release, reset);
        }
    }

    private async applySystemUpdate(release: GithubRelease, reset: boolean): Promise<void> {
        logger.info(`Updating to version ${release.name}.`);
        await this.applyUpdateWorker(release, this.engineOutDir);
        if(reset) {
            logger.info('Restarting Mopo Pinball in 5 seconds.');
            setTimeout(() => process.exit(), 5000);
        }
    }

    private async applyServiceMenuUpdate(release: GithubRelease, reset: boolean): Promise<void> {
        logger.info(`Updating to Service Menu version ${release.name}.`);
        await this.applyUpdateWorker(release, this.serviceMenuDir);
        if(reset) {
            logger.info('Restarting Mopo Pinball in 5 seconds.');
            setTimeout(() => process.exit(), 5000);
        }
    }

    private async applyUpdateWorker(release: GithubRelease, outDir: string): Promise<void> {
        logger.info(`Downloading update...`);
        const downloadStart = new Date();
        const responseStream = await axios.get(release.assets[0].browser_download_url, {withCredentials: false, responseType: 'stream'});
        const downloadDuration = (new Date().valueOf()) - downloadStart.valueOf();
        logger.info(`Update downloaded in ${downloadDuration}ms. Extracting...`);
        const extractStart = new Date();
        responseStream.data.pipe(
            x({
                sync: true,
                strip: 1,
                C: outDir
              })
        );
        const extractDone = (new Date().valueOf()) - extractStart.valueOf();
        logger.info(`Update extracted in ${extractDone}ms.`);
    }

    public async downloadPicsUpdate(release: GithubRelease): Promise<void> {
        logger.info(`Downloading pics version ${release.name}...`);
        const responseStream = await axios.get(release.tarball_url, {withCredentials: false, responseType: 'stream'});
        responseStream.data.pipe(
            x({
                sync: true,
                strip: 1,
                C: picPath
              })
        );
    }

}
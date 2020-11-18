import axios from 'axios';
import {x} from 'tar';
import * as packageManifest from '../../package.json';
// import * as picManifest from '../../pics/package.json';
import * as semver from 'semver';
import {logger} from './logger';
import { GithubRelease } from './github-release';
import { existsSync, readFileSync } from 'fs';

const picPath = '/home/pi/mopo/pics';

export class Update {
    private readonly engineReleaseUrl = 'https://api.github.com/repos/mopopinball/auto-update/releases';
    private readonly picsReleaseUrl = 'https://api.github.com/repos/mopopinball/auto-update/releases';
    private readonly outputDir = '/home/pi/mopo/';

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
        return packageManifest.version;
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

    public async applySystemUpdate(release: GithubRelease): Promise<void> {
        logger.info(`Updating to version ${release.name}...`);
        const responseStream = await axios.get(release.tarball_url, {withCredentials: false, responseType: 'stream'});
        responseStream.data.pipe(
            x({
                strip: 1,
                C: this.outputDir
              })
        );
    }

    public async downloadPicsUpdate(release: GithubRelease): Promise<void> {
        logger.info(`Downloading pics version ${release.name}...`);
        const responseStream = await axios.get(release.tarball_url, {withCredentials: false, responseType: 'stream'});
        responseStream.data.pipe(
            x({
                strip: 1,
                C: picPath
              })
        );
    }

}
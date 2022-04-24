import axios from 'axios';
import {x} from 'tar';
import {version} from '../../package.json';
// import * as picManifest from '../../pics/package.json';
import * as semver from 'semver';
import {logger} from './logger';
import { GithubRelease } from './github-release';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as Rsync from 'rsync';
import * as del from 'del';
import { execSync } from 'child_process';

const picPath = '/home/pi/mopo/pics';

export class Update {
    private readonly engineReleaseUrl = 'https://api.github.com/repos/mopopinball/engine/releases';
    private readonly serviceMenuReleaseUrl = 'https://api.github.com/repos/mopopinball/service-menu/releases/latest'
    private readonly picsReleaseUrl = 'https://api.github.com/repos/mopopinball/auto-update/releases';
    private readonly engineOutDir = '/home/pi/mopo/engine';
    private readonly serviceMenuDir = '/home/pi/mopo/servicemenu/'

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
        return this.isUpdateAvailable('System', this.engineReleaseUrl, prerelease, this.getVersion());
    }

    public async getAvailableServiceMenuUpdate(prerelease: boolean): Promise<GithubRelease> {
        // TODO: Get the real version of the service menu.
        return this.getLatestRelease('Service Menu', this.serviceMenuReleaseUrl, '0.0.0');
    }

    public async getAvailablePicUpdate(prerlease: boolean): Promise<GithubRelease> {
        return this.isUpdateAvailable('Pics', this.picsReleaseUrl, prerlease, this.getPicVersion());
    }

    private async getLatestRelease(componentName: string, releaseUrl: string, currentVersion: string): Promise<GithubRelease> {
        logger.info(`Running ${componentName} version ${currentVersion}. Checking for update.`);
        const candidate: GithubRelease = (await axios.get(releaseUrl)).data;
        return semver.gt(candidate.name, currentVersion) ? candidate : null; 
    }

    private async isUpdateAvailable(componentName: string, releaseUrl: string, prerelease: boolean, currentVersion: string): Promise<GithubRelease> {
        logger.info(`Running ${componentName} version ${currentVersion}. Checking for update.`);
        const candidates: GithubRelease[] = await (await axios.get(releaseUrl)).data;
        
        const releases = candidates.filter((r) =>
            r.prerelease === prerelease && semver.gt(r.name, currentVersion)
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
            await this.applyServiceMenuUpdate(release);
        }
    }

    private async applySystemUpdate(release: GithubRelease, reset: boolean): Promise<void> {
        logger.info(`Updating to version ${release.name}.`);
        await this.applyUpdateWorker(release, this.engineOutDir);
        if(reset) {
            logger.info('Installing system update');
            execSync(`npm ci --prefix ${this.engineOutDir} --production`);
            
            logger.info('Restarting Mopo Pinball in 5 seconds.');
            setTimeout(() => process.exit(), 5000);
        }
    }

    private async applyServiceMenuUpdate(release: GithubRelease): Promise<void> {
        logger.info(`Updating to Service Menu version ${release.name}.`);
        await this.applyUpdateWorker(release, this.serviceMenuDir);
    }

    private makeTempDir(): string {
        const uuid = uuidv4();
        const dir = `/tmp/${uuid}`;
        mkdirSync(dir);
        return dir;
    }

    private async applyUpdateWorker(release: GithubRelease, outDir: string): Promise<void> {
        logger.info(`Downloading update...`);
        const downloadStart = new Date();
        const responseStream = await axios.get(release.assets[0].browser_download_url, {withCredentials: false, responseType: 'stream'});
        const downloadDuration = (new Date().valueOf()) - downloadStart.valueOf();
        const tempDir = this.makeTempDir();
        logger.info(`Update downloaded in ${downloadDuration}ms. Extracting to ${tempDir}`);

        const extractStart = new Date();
        await this.extractResponse(responseStream, tempDir);

        const source = `${tempDir}/`;
        const rsyncCommand = Rsync.build({
            recursive: true,
            delete: true,
            exclude: [
                'node_modules',
                'mopo.log'
            ],
            source: source,
            destination: outDir
        });
        rsyncCommand.set('verbose');

        logger.info(`Syncing from ${source} to ${outDir} with command: ${rsyncCommand.command()}`);

        return new Promise((resolve) => {
            rsyncCommand.execute(
                () => {
                    const extractDone = (new Date().valueOf()) - extractStart.valueOf();
                    logger.info(`Update extracted in ${extractDone}ms.`);
                    del.sync(tempDir, {force: true});
                    resolve();
                },
                (data) => logger.info(data),
                (data) => logger.error(data)
            );
        });
    }

    private extractResponse(responseStream, outDir: string): Promise<void> {
        return new Promise((resolve) => {
            responseStream.data.pipe(
                x({
                    sync: true,
                    strip: 2,
                    C: outDir
                  })
            ).on('end', () => resolve());
        });
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
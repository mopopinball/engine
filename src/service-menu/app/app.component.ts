import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { UpdateDetails } from '../../system/server/update-details';
import { DipSwitchState } from '../../system/dip-switch-state';
import { GithubRelease } from '../../system/github-release';
import { InfoMqttMessage } from '../../system/messages';
import { ClientDevice } from '../../system/server/client-device';
import { SetupState } from '../../system/server/setup-controller';
import { GameOption } from '../../game-selector/select-game';
import {MatDialog} from '@angular/material/dialog';
import { FlashDialogComponent } from './flash-dialog/flash-dialog.component';
import { FlashState } from './flash-state';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    private subscription: Subscription;
    availableUpdate: UpdateDetails;
    info: InfoMqttMessage;
    fps: InfoMqttMessage;
    dips?: DipSwitchState;
    lamps: ClientDevice[] = [];
    coils: ClientDevice[] = [];
    sounds: ClientDevice[] = [];
    switches: any[] = [];
    rows = [0,1,2,3,4,5,6,7,8];
    cols = [1,2,3,4,5,6,7,8];
    systemUpdateInProgress = false;
    menuVersion = '';
    debuggingEnabled = true;
    @ViewChild('fileload') uploadInput: ElementRef;
    setupState: SetupState;
    flashState: FlashState = {
        driver: {
            success: false,
        },
        switches: {
            success: false,
        },
        displays: {
            success: false,
        }
    };
    gameOptions: GameOption[];

    constructor(private http: HttpClient, private _mqttService: MqttService, public dialog: MatDialog) {
        this._mqttService.observe('mopo/info/general').subscribe((message: IMqttMessage) => {
            this.info = JSON.parse(message.payload.toString());
        });
        this._mqttService.observe('mopo/info/fps').subscribe((message: IMqttMessage) => {
            this.fps = JSON.parse(message.payload.toString());
        });

        // Subscribe only long enough to get all initial state, then unsubscribe.
        this.subscription = this._mqttService.observe('mopo/devices/+/all/state').subscribe((message: IMqttMessage) => {
            const parsedPayload: ClientDevice[] = JSON.parse(message.payload.toString()); 
            switch (message.topic) {
            case 'mopo/devices/lamps/all/state':
                for (const parsedDevice of parsedPayload) {
                    this.createOrFetch(parsedDevice, this.lamps).isOn = parsedDevice.isOn;
                }
                break;
            case 'mopo/devices/coils/all/state':
                for (const parsedDevice of parsedPayload) {
                    this.createOrFetch(parsedDevice, this.coils).isOn = parsedDevice.isOn;
                }
                break;
            case 'mopo/devices/sounds/all/state':
                for (const parsedDevice of parsedPayload) {
                    this.createOrFetch(parsedDevice, this.sounds).isOn = parsedDevice.isOn;
                }
                break;
            case 'mopo/devices/switches/all/state':
                this.switches = JSON.parse(message.payload.toString());
                break;
            }
            if (this.lamps.length > 0 && this.coils.length > 0 && this.sounds.length > 0 && this.switches.length > 0) {
                this.subscription.unsubscribe();
            }
        });

        // this._mqttService.observe('mopo/devices/+/+/state/update').subscribe((message: IMqttMessage) => {
        //     const payload = JSON.parse(message.payload.toString());
        //     this.update(this.lamps, payload);
        //     this.update(this.coils, payload);
        //     this.update(this.sounds, payload);
        //     // this.update()
        // });

        // this._mqttService.observe('mopo/devices/dips/all/state').subscribe((message: IMqttMessage) => {
        //     this.dips = JSON.parse(message.payload.toString());
        // });

        this.getDebugingStatus();
    }
    ngOnInit(): void {
        this.getSetupState();
    }

    private createOrFetch(item: ClientDevice, collection: ClientDevice[]): ClientDevice {
        const device = collection.find((c) => c.id === item.id);
        if(device) {
            return device;
        }
        
        collection.push(item);
        return item;
    }

    update(collection: any[], updates: any[]) {
        for (const item of collection) {
            for (const u of updates) {
                if (item.id === u.id) {
                    item.isOn = u.isOn;
                }
            }
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    getSetupState(): void {
        this.http.get<SetupState>('/setup/state').subscribe((state) => {
            this.setupState = state;

            if(this.setupState.required) {
                this.http.get<GameOption[]>('/setup/games').subscribe((games) => {
                    this.gameOptions = games;
                });
            }
        })
    }

    onSelectGame(game: GameOption): void {
        this.http.post('/setup/games', game).subscribe(() => {
            window.location.reload();
        });
    }

    toggleDevice(device: ClientDevice): void {
        this._mqttService.unsafePublish('mopo/devices/anytype/anyid/state/update/client', JSON.stringify(device));
    }

    getSwitch(row: number, col: number): any {
        const swNum = (row * 10) + col;
        const sw = this.switches.find((sw) => sw.number === swNum);
        return sw || {id: '', number: swNum};
    }

    checkForUpdate(): void {
        throw new Error('reimplment me');
        // this.systemUpdateInProgress = true;
        // this.http.post<AvailableUpdate>('/update/check', {}).subscribe((update) => {
        //     this.availableUpdate = {
        //         system: update.system,
        //         pics: update.pics,
        //         serviceMenu: null // because the server doesnt know the current ver, it always returns a result
        //     };
        //     const remoteServiceMenuVer = coerce(update.serviceMenu.name);
        //     const localServiceMenuVer = coerce(version)
        //     if (gt(remoteServiceMenuVer, localServiceMenuVer)) {
        //         this.availableUpdate.serviceMenu = update.serviceMenu;
        //     }
        //     this.systemUpdateInProgress = false;
        // }, () => {
        //     this.systemUpdateInProgress = false;
        // });
    }

    applyUpdate(release: GithubRelease): void {
        this.systemUpdateInProgress = true;
        this.http.post('/update/apply', release).subscribe(() => {
            if (release === this.availableUpdate.serviceMenu) {
                window.location.reload();
                return;
            }
            this.availableUpdate = null;
            this.systemUpdateInProgress = false;
            
        }, () => {
            this.systemUpdateInProgress = false;
        });
    }

    getDebugingStatus(): void {
        this.http.get<boolean>('/update/ruleEngine/status').subscribe((debugEnabled) => {
            this.debuggingEnabled = debugEnabled;
        });
    }

    load(event: Event): void {
        const element = event.currentTarget as HTMLInputElement;
        const file = element.files.item(0);
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            const rules = JSON.parse(fileReader.result.toString());
            this.http.post('/update/ruleEngine/schema', rules).subscribe(); 
            this.uploadInput.nativeElement.value = '';
        };
        fileReader.readAsText(file)
    }

    onUpdatePic(pic: string): void {
        this.flashState[pic].success = null;
        const dialogRef = this.dialog.open(FlashDialogComponent, {
            data: {
              pic: pic,
            },
          });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.http.post(`/setup/pic/${pic}`, {}).subscribe(() => {
                    this.flashState[pic].success = true;
                }, () => {
                    this.flashState[pic].success = false;
                }); 
            }
        });  
    }

    restart(): void {
        this.http.post('/setup/restart', {}).subscribe();
        window.location.reload();
    }
}

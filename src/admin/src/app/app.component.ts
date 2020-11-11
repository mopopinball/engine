import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { InfoMqttMessage } from "../../../system/messages"
import {ClientDevice} from '../../../system/server/client-device';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
    private subscription: Subscription;
    info: InfoMqttMessage;
    fps: InfoMqttMessage;
    lamps: ClientDevice[] = [];
    coils: ClientDevice[] = [];
    sounds: ClientDevice[] = [];
    switches: any[] = [];
    rows = [0,1,2,3,4,5,6,7,8];
    cols = [1,2,3,4,5,6,7,8];

    constructor(private _mqttService: MqttService) {
        this._mqttService.observe('mopo/info/general').subscribe((message: IMqttMessage) => {
            this.info = JSON.parse(message.payload.toString());
        });
        this._mqttService.observe('mopo/info/fps').subscribe((message: IMqttMessage) => {
            this.fps = JSON.parse(message.payload.toString());
        });

        this.subscription = this._mqttService.observe('mopo/devices/+/all/state').subscribe((message: IMqttMessage) => {
            switch (message.topic) {
                case 'mopo/devices/lamps/all/state':
                    this.lamps = JSON.parse(message.payload.toString());
                break;
                case 'mopo/devices/coils/all/state':
                    this.coils = JSON.parse(message.payload.toString());
                break;
                case 'mopo/devices/sounds/all/state':
                    this.sounds = JSON.parse(message.payload.toString());
                break;
                case 'mopo/devices/switches/all/state':
                    this.switches = JSON.parse(message.payload.toString());
                break;
            }
            if (this.lamps.length > 0 && this.coils.length > 0 && this.sounds.length > 0 && this.switches.length > 0) {
                this.subscription.unsubscribe();
            }
        });

        this._mqttService.observe('mopo/devices/+/+/state/update').subscribe((message: IMqttMessage) => {
            const payload = JSON.parse(message.payload.toString());
            this.update(this.lamps, payload);
            this.update(this.coils, payload);
            this.update(this.sounds, payload);
            // this.update()
        });
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

    toggleDevice(device: ClientDevice): void {
        this._mqttService.publish('mopo/devices/anytype/anyid/state/update/client', JSON.stringify(device)).subscribe();
    }

    getSwitch(row: number, col: number): any {
        const swNum = (row * 10) + col;
        const sw = this.switches.find((sw) => sw.number === swNum);
        return sw || {id: '', number: swNum};
    }
}

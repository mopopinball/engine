import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IMqttMessage, MqttService} from 'ngx-mqtt';
import {InfoMqttMessage} from "../../../system/messages"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  private subscription: Subscription;
  info: any;
  fps: any;
  lamps: any[] = [];
  coils: any[] = [];
  sounds: any[] = [];
  switches: any[] = [];
  
  constructor(private _mqttService: MqttService) {
    this.subscription = this._mqttService.observe('mopo/info/general').subscribe((message: IMqttMessage) => {
      this.info = JSON.parse(message.payload.toString());
    });
    this.subscription = this._mqttService.observe('mopo/info/fps').subscribe((message: IMqttMessage) => {
      this.fps = JSON.parse(message.payload.toString());
    });

    this._mqttService.observe('mopo/devices/lamps/all/state').subscribe((message: IMqttMessage) => {
      this.lamps = JSON.parse(message.payload.toString());
    });

    this._mqttService.observe('mopo/devices/coils/all/state').subscribe((message: IMqttMessage) => {
      this.coils = JSON.parse(message.payload.toString());
    });

    this._mqttService.observe('mopo/devices/sounds/all/state').subscribe((message: IMqttMessage) => {
      this.sounds = JSON.parse(message.payload.toString());
    });

    this._mqttService.observe('mopo/devices/switches/all/state').subscribe((message: IMqttMessage) => {
      this.switches = JSON.parse(message.payload.toString());
    });

    this._mqttService.observe('mopo/devices/+/state').subscribe((message: IMqttMessage) => {
      const payload = JSON.parse(message.payload.toString());
      this.update(this.lamps, payload);
      this.update(this.coils, payload);
      this.update(this.sounds, payload);
      // this.update()
    });
  }

  update(collection: any[], updates: any[]) {
    for(const item of collection) {
      for(const u of updates) {
        if (item.id === u.id) {
          item.isOn = u.isOn;
        }
      }
    }
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

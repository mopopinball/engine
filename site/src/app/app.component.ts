import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { IMqttMessage, MqttService } from 'ngx-mqtt';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent /*implements OnInit, OnDestroy*/ {
  title = 'site';
//   private subscription: Subscription;
//   private deviceSubscription: Subscription;
//   topicname: any;
  msg: any;
  isConnected: boolean = false;
  switchMatrix: any;
  lights: any;
  coils: any;
  sounds: any;

  // @ViewChild('msglog', { static: true }) msglog: ElementRef;

  constructor(private _mqttService: MqttService) {
    this.msg = [];
    // this.topicname = 'mopo/#';
    this.switchMatrix = [];
    this.lights = [];
    this.coils = [];
    this.sounds = [];
    this.subscribeToDeviceUpdates();
  }

  // ngOnInit(): void {}

  // ngOnDestroy(): void {
  //   this.subscription.unsubscribe();
  // }

  subscribeToDeviceUpdates(): void {
    this._mqttService.observe('mopo/devices/lamps/all/state')
        .subscribe((message: IMqttMessage) => {
            const payload = JSON.parse(message.payload.toString());
            this.lights = payload;
        });
    this._mqttService.observe('mopo/devices/coils/all/state')
        .subscribe((message: IMqttMessage) => {
            const payload = JSON.parse(message.payload.toString());
            this.coils = payload;
        });
    this._mqttService.observe('mopo/devices/sounds/all/state')
        .subscribe((message: IMqttMessage) => {
            const payload = JSON.parse(message.payload.toString());
            this.sounds = payload;
        });
    this._mqttService.observe('mopo/devices/switches/all/state')
        .subscribe((message: IMqttMessage) => {
            const payload = JSON.parse(message.payload.toString());
            this.switchMatrix = payload;
        });
    this._mqttService.observe('mopo/devices/lamps/+/state')
        .subscribe((message: IMqttMessage) => {
            // console.log(message);
            // let lampNumber = parseInt(message.topic.split('/')[3]);
            let id = message.topic.split('/')[3];
            if (id) {
                const payload = JSON.parse(message.payload.toString());
                this.lights[id].isOn = payload;
            }
            // const payload = JSON.parse(message.payload.toString());
            // this.lights.find((l) => l.number === lampNumber).isOn = payload;
            // console.log(payload);
        });
  }

    testDevice(type, id): void {
        // let deviceType = null;
        // if (device.type === 'LIGHT') {
        //     deviceType = 'lamp';
        // }
        // else {
        //     deviceType = device.type
        // }
        let topic = `mopo/devices/${type}s/${id}/test`;
        console.log(topic);
        // console.log(device);
        
        // non-ssl
        this._mqttService.unsafePublish(topic, JSON.stringify({test: true}));
    }

  public updatePic(): void {
    this._mqttService.unsafePublish('mopo/pic/IC1/update', 'update');
  }
}

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
  info: InfoMqttMessage;
  
  constructor(private _mqttService: MqttService) {
    this.subscription = this._mqttService.observe('mopo/info').subscribe((message: IMqttMessage) => {
      this.info = JSON.parse(message.payload.toString());
    });
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

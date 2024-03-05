import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { OutputDeviceComponent } from './output-device/output-device.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { FlashDialogComponent } from './flash-dialog/flash-dialog.component';

export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
    hostname: document.location.hostname,
    port: 9001
};


@NgModule({
    declarations: [
        AppComponent,
        OutputDeviceComponent,
        FlashDialogComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
        MatDialogModule,
        MatButtonModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }

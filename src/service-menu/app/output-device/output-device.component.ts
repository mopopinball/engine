import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DriverType } from '../../../system/devices/driver-type';
import { ClientDevice } from '../../../system/server/client-device';
// import { DriverType } from '@mopopinball/engine/src/system/devices/driver-type';
// import { ClientDevice } from '@mopopinball/engine/src/system/server/client-device';

@Component({
    selector: 'app-output-device',
    templateUrl: './output-device.component.html',
    styleUrls: ['./output-device.component.scss']
})
export class OutputDeviceComponent {
  @Input() device: ClientDevice;
  @Input() lampIcon: string;
  @Input() icon: string;
  @Output() toggle: EventEmitter<ClientDevice> = new EventEmitter();
  isTesting = false;
  private testingInterval: NodeJS.Timeout;

  toggleDevice(): void {
      this.device.isOn = !this.device.isOn;
      this.toggle.emit(this.device);
  }

  isLampDriver(lamp: ClientDevice): boolean {
      return lamp.driverType === DriverType.LAMP;
  }

  toggleTesting(): void {
      this.isTesting = !this.isTesting;

      if (this.isTesting) {
          this.testingInterval = setInterval(() => this.toggleDevice(), 1000);
      }
      else {
          clearInterval(this.testingInterval);
      }
  }

}

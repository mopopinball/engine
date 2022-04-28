import { address } from 'ip';
import { Sys80or80ADisplay } from './devices/display-80-80a';
import { Security } from './security';

export class ServiceMenu {
    public static showIp(displays: Sys80or80ADisplay): void {
        const ip = address();
        const tokens = ip.split('.');
        displays.setPlayerDisplay(1, tokens[0]);
        displays.setPlayerDisplay(2, tokens[1]);
        displays.setPlayerDisplay(3, tokens[2]);
        displays.setPlayerDisplay(4, tokens[3]);

        const pinCode = Security.getInstance().getPinCode().toString();
        displays.setCredits(pinCode.substring(0, 2));
        displays.setCredits(pinCode.substring(2, 4));
    }
}
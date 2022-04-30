import { address } from 'ip';
import { Sys80or80ADisplay } from './devices/display-80-80a';
import { Security } from './security';
import { execSync } from "child_process";
import { Board } from './board';
import { logger } from './logger';

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

    public static shutdown(displays: Sys80or80ADisplay): void {
        logger.info('Shutting down system.');

        Board.getInstance().shutdown();

        displays.setPlayerDisplay(1, 'SHUT');
        displays.setPlayerDisplay(2, 'DOWN');
        displays.setPlayerDisplay(3, 'PLEASE');
        displays.setPlayerDisplay(4, 'WAIT');

        // this sudo wont require password because of permission update in setup.sh
        setTimeout(() => execSync('sudo halt'), 1000);

        // TODO: is there some way to clear that above message so the user knows its safe?
    }
}
import { Update } from "./update";

describe.skip('Update', () => {
    it('gets the releases', async () => {
        const updater = Update.getInstance();

        await updater.getAvailableSystemUpdate(true);
    });
});
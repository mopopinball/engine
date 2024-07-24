import { RandomAction } from "./random-action";
import { SwitchTrigger } from "./switch-trigger";

describe('trigger', () => {
    it('it can serialize and deserialize designer correctly', () => {
        // setup
        const switchTrigger = new SwitchTrigger('test');
        switchTrigger.designer = {
            id: 'i',
            x: 1,
            y: 2
        }

        // execute
        const json = switchTrigger.toJSON();
        const back = SwitchTrigger.fromJSON(json);

        // check
        expect(back.designer.id).toEqual('i');
        expect(back.designer.x).toEqual(1);
        expect(back.designer.y).toEqual(2);
    });

});

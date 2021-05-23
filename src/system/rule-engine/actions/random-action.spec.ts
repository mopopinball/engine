import { OutputDeviceType } from "../../devices/output-device-type";
import { DesiredOutputState } from "../desired-output-state";
import { DeviceAction } from "./device-action";
import { RandomAction } from "./random-action";

describe('random action', () => {
    it('it computes a derived weight if not provided', () => {
        const randomAction = new RandomAction([{
            weight: 0.4
        }, {
            // no weight
        }]);

        // check
        expect(randomAction.candidates[0].weight).toBe(0.4);
        expect(randomAction.candidates[1].derivedWeight).toBe(0.6);
    });

    it('serialies-deserializes', () => {
        const action = new RandomAction([{
            weight: 0.4,
            triggerId: 'abc'
        }, {
            weight: 0.6,
            action: new DeviceAction(new DesiredOutputState('a', OutputDeviceType.COIL, true))
        }]);

        const serialized = action.toJSON();
        const loaded = RandomAction.fromJSON(serialized);

        // check
        expect(loaded.candidates[0].weight).toBe(.4);
        expect(loaded.candidates[0].triggerId).toBe('abc');
        expect(loaded.candidates[1].weight).toBe(.6);
        expect(loaded.candidates[1].action).toBeTruthy();
    });
});

import { DataItem } from "../rule-data";
import { DataAction } from "./data-action";
import { TimedAction } from "./timed-action";

describe('Timed Action', () => {
    it('will do nothing on no steps', () => {
        const timedAction = new TimedAction('a', []);

        // exercise
        timedAction.handle(null, new Map(), new Map());

        // check
        expect(timedAction.currentStep).toBeNull();
    });

    it('runs some steps', () => {
        const timedAction = new TimedAction('a', [{
            intervalMs: 10,
            actions: []
        }, {
            intervalMs: 20,
            actions: []
        }]);

        // exercise & expect
        // timedAction.handle(null, new Map(), new Map());
        const isNew0 = timedAction.setNewCurrentStep();
        expect(isNew0).toBeTruthy();
        expect(timedAction.currentStep).toBe(timedAction.steps[0]);
        
        const isNew1 = timedAction.setNewCurrentStep();
        expect(isNew1).toBeTruthy();
        expect(timedAction.currentStep).toBe(timedAction.steps[1]);

        const isNew2 = timedAction.setNewCurrentStep();
        expect(isNew2).toBeFalsy();
    });

    it('runs actions in a step', () => {
        const timedAction = new TimedAction('a', [{
            intervalMs: 10,
            actions: [
                new DataAction('d0', null, null, 'd0 + 1'),
                new DataAction('d0', null, null, 'd0 + 2')
            ]
        }]);
        const data = new Map<string, DataItem>();
        data.set('d0', {id: 'd0', type: 'number', value: 10, initValue: 10})

        // exercise
        timedAction.handle(null, data, null);

        // check
        expect(data.get('d0').value).toBe(13);

        // finall
        timedAction.cancel();
    });
});
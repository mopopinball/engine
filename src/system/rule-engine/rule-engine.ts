import { PlayfieldLamp2 } from "../playfieldLamp2";
import { Action } from "./actions/action";
import { DataAction } from "./actions/data-action";
import { DeviceAction } from "./actions/device-action";
import { RuleData } from "./rule-data";
import { RuleSchema } from "./schema/rule.schema";

export class RuleEngine {
    active: boolean;
    data: Map<string, RuleData> = new Map();
    devices: Map<string, PlayfieldLamp2> = new Map();
    switches: Map<string, Action[]> = new Map();
    private children: RuleEngine[] = [];

    constructor(public name: string, public autoStart: boolean){
    }

    load(schema: RuleSchema) {
        this.autoStart = schema.autostart;
        
        for (const action of schema.actions) {
            switch(action.type) {
                case 'data':
                    this.addAction(
                        action.switchId,
                        new DataAction(action.dataId, action.operation, action.operand)
                    );
                break;
                case 'device':
                    this.addAction(
                        action.switchId,
                        new DeviceAction(action.deviceId, action.state)
                    )
                    break;        
            }
        }
        for (const data of schema.data) {
            this.data.set(data.id, {value: 0});
        }
    }

    private addAction(key: string, action: Action): void {
        if(!this.switches.has(key)) {
            this.switches.set(key, []);
        }
        this.switches.get(key).push(action);
    }

    start(): void {
        this.active = true;
        this.children
            .filter((child) => child.autoStart)
            .map((c) => c.start());
    }

    stop(): void {
        this.active = false;
        this.children
            .map((c) => c.stop());
    }

    onSwitch(id: string): boolean {
        const childHandled = this.getActiveChildren()
            .map((child) => child.onSwitch(id))
            .reduce((accum, curv) => {
                return accum || curv;
            }, false);

        if (childHandled) {
            return true;
        } else if(this.switches.has(id)) {
            for(const action of this.switches.get(id)) {
                action.handle(this.getData(), this.getDevices());
            }
            return true;
        } else {
            return false;
        }
    }

    // compressed data.
    getData(parentData: Map<string, RuleData> = new Map()): Map<string, RuleData> {
        let newData: Map<string, RuleData> = new Map();
        // copy parent data
        for (const entry of Array.from(parentData.entries())) {
            newData.set(entry[0], entry[1]);
        }
        // copy our data which overwrites parents
        for(const entry of this.data.entries()) {
            newData.set(entry[0], entry[1]);
        }
        // recurse down on our children and repeat.
        for(const activeChild of this.getActiveChildren()) {
            newData = activeChild.getData(newData);
        }

        return newData;
    }

    getDevices(parentDevices: Map<string, PlayfieldLamp2> = new Map()): Map<string, PlayfieldLamp2> {
        let devices: Map<string, PlayfieldLamp2> = new Map();
        // copy parent devices
        for (const parentEntry of Array.from(parentDevices.entries())) {
            devices.set(parentEntry[0], parentEntry[1]);
        }
        // copy our devices which overwrites parent's
        for(const entry of this.devices.entries()) {
            devices.set(entry[0], entry[1]);
        }
        // recurse down on our children and repeat.
        for(const activeChild of this.getActiveChildren()) {
            devices = activeChild.getDevices(devices);
        }
        return devices;
    }

    private getActiveChildren(): RuleEngine[] {
        return this.children.filter((c) => c.active);
    }
}
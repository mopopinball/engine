import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutputDeviceComponent } from './output-device.component';

describe('OutputDeviceComponent', () => {
    let component: OutputDeviceComponent;
    let fixture: ComponentFixture<OutputDeviceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ OutputDeviceComponent ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OutputDeviceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

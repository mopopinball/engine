import {byte} from 'bitwise';

describe('system 80/80A font', () => {
    describe('character builder', () => {
        const getIntRepresentation = (b): number => {
            return byte.write(b);
        };

        it('gets O correctly', () => {
            const result = getIntRepresentation([
                0, // h
                0, // g
                1, // f
                1, // e
                1, // d
                1, // c
                1, // b
                1  // a
            ]);
            expect(result).toBe(63);
        });
        
        it('gets T correctly', () => {
            const result = getIntRepresentation([
                1, // h
                0, // g
                0, // f
                0, // e
                0, // d
                0, // c
                0, // b
                1  // a
            ]);
            expect(result).toBe(129);
        });

        // the following test does not assert, its a tool
        it('TOOL: get int representation', () => {
            const result = getIntRepresentation([
                1, // h
                0, // g
                1, // f
                1, // e
                0, // d
                1, // c
                1, // b
                1  // a
            ]);
            console.log(`The INT code is: ${result}`);
        });
    });
});
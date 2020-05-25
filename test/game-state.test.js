const GameState = require('../src/game-state');
const expect = require('chai').expect;
const _eval = require('eval');

describe('GameState', () => {
    it('machine can have data', () => {
        // exercise
        const gameState = new GameState('root', {
            data: {
                a: 1,
                b: 2
            },
            states: {}
        });

        // check
        expect(gameState.data.a).to.be.equal(1);
        expect(gameState.data.b).to.be.equal(2);
    });

    it('machine can define states', () => {
        // exercise
        const gameState = new GameState('root', {
            states: {
                a: {
                    init: true,
                    to: 'b',
                    data: {
                        c: 3
                    }
                },
                b: {
                    to: 'a'
                }
            }
        });

        // check
        expect(gameState.allStates().length).to.be.equal(2 + 1); // includes none, a, b
        expect(Object.keys(gameState.states).length).to.be.equal(2);
        expect(gameState.state).to.be.equal('a');
        expect(gameState.states['a'].data.c).to.be.equal(3);
    });

    it('machine can define children', () => {
        // exercise
        const gameState = new GameState('root', {
            states: {
                a: {
                    init: true
                },
                b: {
                }
            },
            children: {
                c0: {
                    states: {
                        s0: {
                            init: true
                        }
                    }
                }
            }
        });

        // check
        expect(gameState.allStates().length).to.be.equal(2 + 1); // includes "none"
        expect(gameState.children.length).to.be.equal(1);
    });

    it('states can define children', () => {
        // exercise
        const gameState = new GameState('root', {
            states: {
                a: {
                    init: true,
                    children: {
                        c0: {
                            data: {
                                d0: 100
                            }
                        }
                    }
                },
                b: {
                    children: {
                        c1: {
                            data: {
                                d1: 200
                            }
                        }
                    }
                }
            }
        });

        // check
        const compressed = gameState.getCompressedState();
        expect(compressed.data.d0).to.be.equal(100);
    });

    it('resets child states when parent changes', () => {
        // setup
        const gameState = new GameState('root', {
            states: {
                a: {
                    init: true,
                    to: 'b',
                    children: {
                        c0: {
                            states: {
                                c: {
                                    init: true,
                                    to: 'd'
                                },
                                d: {
                                    to: 'c' // needs to be implicit
                                }
                            }
                        }
                    }
                },
                b: {
                    to: 'a',
                    children: {
                        c1: {
                        }
                    }
                }
            }
        });

        expect(gameState.state).to.be.equal('a');
        expect(gameState.states.a.children[0].state).to.be.equal('c');

        // exercise
        gameState.states.a.children[0].tod();
        expect(gameState.states.a.children[0].state).to.be.equal('d');

        gameState.tob(); // should reset c0 to state 'c'.

        // verify
        expect(gameState.states.a.children[0].state).to.be.equal('c');
    });

    describe('getDeviceState', () => {
        it('machines can define output device state', () => {
            // setup
            const gameState = new GameState('root', {
                devices: {
                    lamp1: false
                }
            });

            // exercise
            const deviceState = gameState.getDeviceState('lamp1');

            // check
            expect(deviceState).to.be.equal(false);
        });

        it('states can define output device state', () => {
            // setup
            const gameState = new GameState('root', {
                devices: {
                    lamp1: false
                },
                states: {
                    a: {
                        init: true,
                        devices: {
                            lamp1: true
                        }
                    }
                }
            });

            // exercise
            const deviceState = gameState.getDeviceState('lamp1');

            // check
            expect(deviceState).to.be.equal(true);
        });

        it('can define children output device state', () => {
            // exercise
            const gameState = new GameState('root', {
                devices: {
                    lamp1: false
                },
                states: {
                    a: {
                        init: true,
                        devices: {
                            lamp1: true
                        }
                    }
                },
                children: {
                    c0: {
                        devices: {
                            lamp1: 'blink'
                        }
                    }
                }
            });

            // exercise
            const deviceState = gameState.getDeviceState('lamp1');

            // check
            expect(deviceState).to.be.equal('blink');
        });
    });

    describe('getAllDeviceStates', () => {
        it('gets devices from all levels', () => {
            // setup
            const gameState = new GameState('root', {
                devices: {
                    lamp1: false
                },
                states: {
                    a: {
                        init: true,
                        devices: {
                            lamp2: false
                        }
                    },
                    b: {
                        devices: {
                            lamp3: false // wont fetch, not active
                        }
                    }
                },
                children: {
                    c0: {
                        devices: {
                            lamp4: false
                        },
                        states: {
                            c: {
                                init: true,
                                devices: {
                                    lamp5: false
                                }
                            }
                        }
                    }
                }
            });

            // exercise
            const allDevices = gameState.getAllDeviceStates();

            // check
            expect(allDevices.length).to.be.equal(4);
            allDevices.forEach((d) => {
                expect(gameState.getDeviceState(d)).to.be.false;
            });
        });
    });

    describe('onAction', () => {
        it('can define machine actions', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [
                            () => 1
                        ]
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(Object.keys(gameState.actions).length).to.be.equal(1);
        });

        it('can define actions with multiple targets', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    d0: 0,
                    d1: 0
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [
                            function() {
                                this.data.d0 = 10;
                            },
                            function() {
                                this.data.d1 = 11;
                            }
                        ]
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.data.d0).to.be.equal(10);
            expect(gameState.data.d1).to.be.equal(11);
        });

        it('can define state actions', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [
                            () => 1
                        ]
                    }
                },
                states: {
                    a: {
                        init: true,
                        actions: {
                            sw1: {
                                type: 'switch',
                                targets: [
                                    () => 2
                                ]
                            }
                        }
                    }
                }
            });

            // exercise
            const result = gameState.onAction('sw1');

            // check
            expect(result[0]).to.be.equal(2);
        });

        it('can define children actions', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [
                            () => 1
                        ]
                    }
                },
                states: {
                    a: {
                        init: true,
                        actions: {
                            sw1: {
                                type: 'switch',
                                targets: [
                                    () => 2
                                ]
                            }
                        }
                    }
                },
                children: {
                    c0: {
                        actions: {
                            sw1: {
                                type: 'switch',
                                targets: [
                                    () => 3
                                ]
                            }
                        },
                    }
                }
            });

            // exercise
            const result = gameState.onAction('sw1');

            // check
            expect(result[0]).to.be.equal(3);
        });

        it('machine action changes state', () => {
            // setup
            const gameState = new GameState('root', {
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [{
                            type: 'state',
                            target: 'b'
                        }]
                    }
                },
                states: {
                    a: {
                        init: true,
                        to: 'b',
                        data: {
                            c: 3
                        }
                    },
                    b: {
                        to: 'a'
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.state).to.be.equal('b');
        });

        it('machine action is callable on data', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0,
                    d2: 0
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [function() {
                            this.data.score += 10;
                        }]
                    },
                    sw2: {
                        type: 'switch',
                        targets: [
                            function() {
                                _eval('this.data.score = 1; this.data.d2 = 100;', this);
                            }
                        ]
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.data.score).to.be.equal(10);

            // exercise
            gameState.onAction('sw2');

            // check
            expect(gameState.data.score).to.be.equal(1);
            expect(gameState.data.d2).to.be.equal(100);
            expect(gameState.getCompressedState().data.score).to.be.equal(1);
            expect(gameState.getCompressedState().data.d2).to.be.equal(100);
        });

        it('can define actions to increment data', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 123
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [{
                            type: 'data',
                            id: 'score',
                            increment: 100
                        }]
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.data.score).to.be.equal(223);
        });

        it('can define actions to decrement data', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 123
                },
                actions: {
                    sw1: {
                        type: 'switch',
                        targets: [{
                            type: 'data',
                            id: 'score',
                            increment: -10
                        }]
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.data.score).to.be.equal(113);
        });

        it('can define state actions which set machine data', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                states: {
                    a: {
                        init: true,
                        actions: {
                            sw1: {
                                type: 'switch',
                                targets: [{
                                    type: 'data',
                                    id: 'score',
                                    value: 100
                                }]
                            }
                        }
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.data.score).to.be.equal(100);
            expect(gameState.getCompressedState().data.score).to.be.equal(100);
        });

        it('can define state actions which set state data', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                states: {
                    a: {
                        init: true,
                        data: {
                            d0: 0
                        },
                        actions: {
                            sw1: {
                                type: 'switch',
                                targets: [{
                                    type: 'data',
                                    id: 'd0',
                                    value: 100
                                }]
                            }
                        }
                    }
                }
            });

            // exercise
            gameState.onAction('sw1');

            // check
            expect(gameState.states['a'].data.d0).to.be.equal(100);
            expect(gameState.getCompressedState().data.d0).to.be.equal(100);
        });

        describe('can have conditional targets', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    d0: 0
                },
                actions: {
                    a0: {
                        type: 'switch',
                        targets: [{
                            type: 'conditional',
                            condition: 'this.data.d0 < 1',
                            true: {
                                type: 'data',
                                id: 'd0',
                                value: 'v'
                            },
                            false: {
                                type: 'state',
                                target: 's1'
                            }
                        }],
                    }
                },
                states: {
                    s0: {
                        init: true,
                        to: 's1'
                    },
                    s1: {}
                }
            });

            it('evaluates true condition', () => {
                // setup
                gameState.data.d0 = 0;

                // exercise
                gameState.onAction('a0');

                // check
                expect(gameState.data.d0).to.be.equal('v');
            });

            it('evaluates false condition', () => {
                // setup
                gameState.data.d0 = 2;

                // exercise
                gameState.onAction('a0');

                // check
                expect(gameState.state).to.be.equal('s1');
            });
        });

        it('supports interval actions', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                actions: {
                    t0: {
                        type: 'interval',
                        period: 1000,
                        targets: [() => 1000]
                    }
                },
                states: {
                    s0: {
                        init: true,
                        actions: {
                            t1: {
                                type: 'interval',
                                period: 2000,
                                targets: [() => 2000]
                            },
                            t0: {
                                type: 'interval',
                                period: 3000,
                                targets: [() => 3000]
                            }
                        }
                    }
                },
                children: {
                    c0: {
                        actions: {
                            t2: {
                                type: 'timeout',
                                delay: 4000,
                                targets: [() => 4000]
                            }
                        }
                    }
                }
            });

            // exercise
            const actions = gameState.getActiveTimers();

            // check
            expect(actions.length).to.be.equal(3);
            const periods = actions.map((a) => a.period);
            expect(periods.indexOf(2000)).to.be.gte(0);
            expect(periods.indexOf(3000)).to.be.gte(0);
            const delays = actions.map((a) => a.delay);
            expect(delays.indexOf(4000)).to.be.gte(0);
        });

        it('supports collection actions', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                actions: {
                    qualifiesPlayfield: {
                        type: 'collection',
                        collection: ['sw1', 'sw2'],
                        targets: [() => 1000]
                    }
                }
            });

            // exercise
            const actions = gameState.onAction('sw1');

            // check
            expect(actions.length).to.be.equal(1);
            expect(actions[0]).to.be.equal(1000);
        });
    });

    describe('getCompressedState', () => {
        it('can compress down data', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    d0: 0,
                    d1: 1
                },
                states: {
                    s0: {
                        init: true,
                        data: {
                            d1: 11,
                            d2: 2,
                            d3: 3
                        }
                    }
                },
                children: {
                    c0: {
                        data: {
                            d3: 33
                        }
                    }
                }
            });

            // exercise
            const compressed = gameState.getCompressedState();

            // check
            expect(compressed).to.exist;
            expect(compressed.data.d0).to.be.equal(0);
            expect(compressed.data.d1).to.be.equal(11);
            expect(compressed.data.d2).to.be.equal(2);
            expect(compressed.data.d3).to.be.equal(33);
        });

        it('can compress down devices', () => {
            // setup
            const gameState = new GameState('root', {
                devices: {
                    lamp0: false,
                    lamp1: false
                },
                states: {
                    a: {
                        init: true,
                        devices: {
                            lamp1: true,
                            lamp2: false
                        }
                    }
                },
                children: {
                    c0: {
                        devices: {
                            lamp2: 'a'
                        }
                    }
                }
            });

            // exercise
            const compressed = gameState.getCompressedState();

            // check
            expect(compressed.devices.lamp0).to.be.false;
            expect(compressed.devices.lamp1).to.be.true;
            expect(compressed.devices.lamp2).to.be.equal('a');
        });

        it('can compress down actions', () => {
            // setup
            const gameState = new GameState('root', {
                actions: {
                    sw0: {
                        type: 'switch',
                        targets: [
                            () => 0
                        ]
                    },
                    sw1: {
                        type: 'switch',
                        targets: [
                            () => 1
                        ]
                    }
                },
                states: {
                    a: {
                        init: true,
                        actions: {
                            sw1: {
                                type: 'switch',
                                targets: [
                                    () => 11
                                ]
                            },
                            sw2: {
                                type: 'switch',
                                targets: [
                                    () => 2
                                ]
                            }
                        }
                    }
                },
                children: {
                    c0: {
                        actions: {
                            sw2: {
                                type: 'switch',
                                targets: [
                                    () => 22
                                ]
                            }
                        }
                    }
                }
            });

            // exercise
            const compressed = gameState.getCompressedState();

            // check
            expect(compressed.actions.sw0.targets[0]()).to.be.equal(0);
            expect(compressed.actions.sw1.targets[0]()).to.be.equal(11);
            expect(compressed.actions.sw2.targets[0]()).to.be.equal(22);
        });
    });
});

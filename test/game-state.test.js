const GameState = require('../src/game-state');
const expect = require('chai').expect;
const _eval = require('eval');

describe('GameState', () => {
// todo: when going depth first on operations, only consider active states for data, actions.
// all active actions in each branch should be considered.

    // const gameplayConfig = {
    //      name: 'root',
    //     data: {},
    //     actions: [{
    //         id: 'sw1',
    //         target: 'newState',
    //          target: {type: 'state', value: 'newState'}
    //          target: {type: 'data', id: 'a', value: 100, operator: '+='}
    //     }, {
    //         id: 'sw2',
    //         target: (args) => {}
    //     }],
    //     states: {
    //         stateA: {
    //             data: {},
    //             actions: [{
    //                 id: 'sw3',
    //                 target: require('something')()
    //             }, {
    //                 id: 'sw4',
    //                 target: (lamp, method, ...args) => lamp[method](args)
    //             }]
    //         }
    //     }
    // };

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

    describe('onAction', () => {
        it('can define machine actions', () => {
            // setup
            const gameState = new GameState('root', {
                data: {
                    score: 0
                },
                actions: {
                    sw1: {
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
                        targets: [function() {
                            this.data.score += 10;
                        }]
                    },
                    sw2: {
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
});

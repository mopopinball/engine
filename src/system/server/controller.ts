import express from 'express';

export interface Controller {
    setup(app: express.Express): void;
}
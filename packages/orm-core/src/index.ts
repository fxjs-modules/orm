export import Utils = require('./utils');

export type { FxOrmCoreCallbackNS } from './callback';
export type { FxOrmCoreSyncNS } from './sync';
export type { FxOrmCoreError } from './error';

export {
    catchBlocking,
    takeAwayResult,
} from './error';
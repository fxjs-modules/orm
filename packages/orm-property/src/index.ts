import * as Transformers from '././transformers';

export { Transformers };

export function transformer (type: keyof typeof Transformers): typeof Transformers[typeof type] {
    return Transformers[type];
}

export { defineCustomType } from './customTypes';
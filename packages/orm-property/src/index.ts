import * as Transformers from './transformers';

export { Transformers };

export type { IProperty } from './Property';

export function transformer(type: 'mysql'): typeof Transformers['mysql']
export function transformer(type: 'postgresql'): typeof Transformers['postgresql']
export function transformer(type: 'sqlite'): typeof Transformers['sqlite']
export function transformer (type: keyof typeof Transformers): typeof Transformers[typeof type] {
    return Transformers[type];
}

export { defineCustomType } from './customTypes';

// TODO: add type test for it
export { ExtractColumnInfo } from './Property';

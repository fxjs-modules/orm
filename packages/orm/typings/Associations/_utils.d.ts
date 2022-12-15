/// <reference lib="es6" />
import type { FxOrmAssociation } from "../Typo/assoc";
import type { FxOrmModel } from "../Typo/model";
import type { FxOrmProperty } from "../Typo/property";
export declare function defineDefaultExtendsToTableName(modelTableName: string, assocName: string): string;
declare type ACCESSOR_PREFIX = 'add' | 'get' | 'set' | 'has' | 'remove' | 'findBy';
export declare function defineAssociationAccessorMethodName(prefixer: ACCESSOR_PREFIX, assocName: string): string;
export declare const ACCESSOR_KEYS: {
    [k: string]: ACCESSOR_PREFIX;
};
export declare function getMapsToFromProperty(property: FxOrmProperty.NormalizedProperty, k: string): string;
export declare function getMapsToFromPropertyHash(hash: Record<string, FxOrmProperty.NormalizedProperty>): string[];
export declare function cutOffAssociatedModelFindOptions(findby_options: FxOrmAssociation.ModelAssociationMethod__FindByOptions, association_name: string): any;
export declare function addAssociationInfoToModel(Model: FxOrmModel.Model, association_name: string, opts: FxOrmModel.Model['associations'][any]): FxOrmModel.Model['associations'][string];
export {};

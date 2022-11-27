/// <reference lib="es5" />
import type { FxOrmInstance } from '../Typo/instance';
import type { FxOrmAssociation } from '../Typo/assoc';
import type { FxOrmModel } from '../Typo/model';
import type { FxOrmDMLDriver } from '../Typo/DMLDriver';
import type { FxOrmNS } from '../Typo/ORM';
export declare function prepare(Model: FxOrmModel.Model, assocs: {
    one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
    many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
    extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[];
}, opts: {
    db: FxOrmNS.ORM;
}): void;
export declare function extend(Model: FxOrmModel.Model, Instance: FxOrmInstance.Instance, Driver: FxOrmDMLDriver.DMLDriver, associations: FxOrmAssociation.InstanceAssociationItem_HasMany[], cfg: {
    assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany;
    genHookHandlerForInstance: Function;
}): void;
export declare function autoFetch(Instance: FxOrmInstance.Instance, associations: FxOrmAssociation.InstanceAssociationItem_HasMany[], opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany, parallel?: boolean): void;

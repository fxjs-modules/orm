import type { FxOrmInstance } from '../Typo/instance';
import type { FxOrmAssociation } from '../Typo/assoc';
import type { FxOrmNS } from '../Typo/ORM';
import type { FxOrmModel } from '../Typo/model';
import type { FxOrmDMLDriver } from '../Typo/DMLDriver';
/**
 *
 * @param db orm instance
 * @param Model model
 * @param associations association definitions
 */
export declare function prepare(Model: FxOrmModel.Model, assocs: {
    one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
    many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
    extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[];
}, opts: {
    db: FxOrmNS.ORM;
}): void;
export declare function extend(Model: FxOrmModel.Model, Instance: FxOrmInstance.Instance, Driver: FxOrmDMLDriver.DMLDriver, associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[], cfg: {
    assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasOne;
    genHookHandlerForInstance: Function;
}): void;
export declare function autoFetch(Instance: FxOrmInstance.Instance, associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[], opts: FxOrmNS.ModelAutoFetchOptions, parallel?: boolean): void;

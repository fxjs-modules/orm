import { FxOrmInstance } from '../Typo/instance';
import { FxOrmAssociation } from '../Typo/assoc';
import { FxOrmModel } from '../Typo/model';
import { FxOrmNS } from '../Typo/ORM';
import { FxOrmDMLDriver } from '../Typo/DMLDriver';
export declare function prepare(Model: FxOrmModel.Model, assocs: {
    one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
    many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
    extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[];
}, opts: {
    db: FxOrmNS.ORM;
}): void;
export declare function extend(Model: FxOrmModel.Model, Instance: FxOrmInstance.Instance, Driver: FxOrmDMLDriver.DMLDriver, associations: FxOrmAssociation.InstanceAssociationItem_HasOne[], cfg: {
    assoc_opts: any;
    genHookHandlerForInstance: Function;
}): void;
export declare function autoFetch(Instance: FxOrmInstance.Instance, associations: FxOrmAssociation.InstanceAssociationItem[], opts: FxOrmAssociation.AutoFetchInstanceOptions, parallel: boolean): void;

import {
    Driver as DbDriver,
    FxDbDriverNS,
    IDbDriver
} from "@fxjs/db-driver";
import Hook           = require('./Hook');
import Utilities      = require("./Utilities");

import ORMError from "./Error";

import { FxOrmNS } from './Typo/ORM';
import { FxOrmInstance } from './Typo/instance';
import { FxOrmAssociation } from './Typo/assoc';
import { FxOrmModel } from './Typo/model';
import { FxOrmHook } from './Typo/hook';
import { FxOrmProperty } from "./Typo/property";

export function buildDbDriver (opts: string | FxDbDriverNS.DBConnectionConfig): FxOrmNS.ORMLike | IDbDriver {
    if (!opts) {
        return Utilities.ORM_Error(new ORMError("CONNECTION_URL_EMPTY", 'PARAM_MISMATCH'));
    } else if (typeof opts === 'string') {
		if ((opts as string).trim().length === 0) {
			return Utilities.ORM_Error(new ORMError("CONNECTION_URL_EMPTY", 'PARAM_MISMATCH'));
		}
	}
    let driver: IDbDriver = null
    try {
        driver = DbDriver.create(opts)
    } catch (error) {
        if (error.message === '[driver.config] invalid protocol')
    		return Utilities.ORM_Error(new ORMError("CONNECTION_URL_NO_PROTOCOL", 'PARAM_MISMATCH'));
    }
    const config = driver.config

    const isSqlite = config.protocol === 'sqlite:';

	if (isSqlite && config.timezone === undefined)
        driver.extend_config.timezone = 'UTC';

    return driver;
}

/* model helpers :start */
// TODO: add test case
export function pickProperties<T extends FxOrmModel.Model = FxOrmModel.Model>(
    m: T,
    picker: ((p: FxOrmProperty.NormalizedProperty, k: string, m: T) => boolean)
) {
    return Object.entries(m.__propertiesByName).reduce((accu, [k, prop]) => {
        if (picker(prop, k, m)) {
            accu[k] = prop
        };
        return accu;
    }, {} as Record<string, FxOrmProperty.NormalizedProperty>);
}
/* model helpers :end */

function manyAssocsFromInst (instance: FxOrmInstance.Instance): FxOrmAssociation.InstanceAssociationItem_HasMany[] {
    return instance.__instRtd.many_associations
}
function oneAssocsFromInst (instance: FxOrmInstance.Instance): FxOrmAssociation.InstanceAssociationItem_HasOne[] {
    return instance.__instRtd.one_associations
}
function extendsToAssocsFromInst (instance: FxOrmInstance.Instance): FxOrmAssociation.InstanceAssociationItem_ExtendTos[] {
    return instance.__instRtd.extend_associations
}

/* by instance extname :start */
export function getManyAssociationItemFromInstanceByExtname (instance: FxOrmInstance.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem_HasMany {
    const many_assocs = manyAssocsFromInst(instance)
    
    return many_assocs.find(a => a.name === extend_name)
}

export function getOneAssociationItemFromInstanceByExtname (instance: FxOrmInstance.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem_HasOne {
    const one_assocs = oneAssocsFromInst(instance)
    
    return one_assocs.find(a => a.name === extend_name)
}

export function getExtendsToAssociationItemFromInstanceByExtname (instance: FxOrmInstance.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem_ExtendTos {
    const extendsto_assocs = extendsToAssocsFromInst(instance)
    
    return extendsto_assocs.find(a => a.name === extend_name)
}

export function getAssociationItemFromInstanceByExtname (reltype: string, inst: FxOrmInstance.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem {
    switch (reltype) {
        default:
            throw 'invalid association reltype!'
        case 'extendsTo':
            return getExtendsToAssociationItemFromInstanceByExtname(inst, extend_name);
            
        case 'hasOne':
            return getOneAssociationItemFromInstanceByExtname(inst, extend_name);
            
        case 'hasMany':
            return getManyAssociationItemFromInstanceByExtname(inst, extend_name);
    }
}
/* by instance extname :end */

/* by instance x assoc_model :start */
export function getManyAssociationItemFromInstanceByAssocModel (instance: FxOrmInstance.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasMany {
    const many_assocs = manyAssocsFromInst(instance)
    
    return many_assocs.find(a => a.model === assoc_model)
}
export function getOneAssociationItemFromInstanceByAssocModel (instance: FxOrmInstance.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasOne {
    const one_assocs = oneAssocsFromInst(instance)
    
    return one_assocs.find(a => a.model === assoc_model)
}
export function getExtendsToAssociationItemFromInstanceByAssocModel (instance: FxOrmInstance.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_ExtendTos {
    const extendsto_assocs = extendsToAssocsFromInst(instance)
    
    return extendsto_assocs.find(a => a.model === assoc_model)
}
export function getAssociationItemFromInstanceByAssocModel (reltype: string, inst: FxOrmInstance.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem {
    switch (reltype) {
        default:
            throw 'invalid association reltype!'
        case 'extendsTo':
            return getManyAssociationItemFromInstanceByAssocModel(inst, assoc_model);
            
        case 'hasOne':
            return getOneAssociationItemFromInstanceByAssocModel(inst, assoc_model);
            
        case 'hasMany':
            return getExtendsToAssociationItemFromInstanceByAssocModel(inst, assoc_model);
    }
}
/* by instance x assoc_model :end */

/* by ext_name x _model :start */
export function getManyAssociationItemFromModel (ext_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasMany {
    const rel_info = _model.associations[ext_name]

    if (!rel_info || rel_info.type !== 'hasMany')
        return null;

    return rel_info.association
}
export function getOneAssociationItemFromModel (ext_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasOne {
    const rel_info = _model.associations[ext_name]

    if (!rel_info || rel_info.type !== 'hasOne')
        return null;

    return rel_info.association
}
export function getExtendsToAssociationItemFromModel (ext_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_ExtendTos {
    const rel_info = _model.associations[ext_name]

    if (!rel_info || rel_info.type !== 'extendsTo')
        return null;

    return rel_info.association
}
export function getAssociationItemFromModel (reltype: string, extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem {
    switch (reltype) {
        default:
            throw 'invalid association reltype!'
        case 'extendsTo':
            return getManyAssociationItemFromModel(extend_name, _model);
            
        case 'hasOne':
            return getOneAssociationItemFromModel(extend_name, _model);
            
        case 'hasMany':
            return getExtendsToAssociationItemFromModel(extend_name, _model);
    }
}
export function tryGetAssociationItemFromModel (extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem {
    return getManyAssociationItemFromModel(extend_name, _model) || getOneAssociationItemFromModel(extend_name, _model) || getExtendsToAssociationItemFromModel(extend_name, _model)
}
/* by ext_name x assoc_model :end */

/* hooks :start */
export function prependHook (hooks: FxOrmModel.Hooks, hookName: keyof FxOrmModel.Hooks, preLogic: FxOrmHook.HookActionCallback | FxOrmHook.HookResultCallback): void {
	if (typeof hooks[hookName] === 'function') {
		var oldHook = hooks[hookName];
		
		const callOldHook = function (next: Function|boolean) {
            if (typeof oldHook === 'function') {
                if (oldHook.length > 0)
                    return oldHook.call(this, next)
                
				oldHook.call(this)
			}
			
			if (typeof next === 'function')
				next()
		}
		
		hooks[hookName] = function (next: any) {
			if (preLogic.length > 0) {
				var self = this
				return preLogic.call(this, function () {
					callOldHook.call(self, next)
				})
			}

			preLogic.call(this)
			callOldHook.call(this, next)
		};
	} else {
		hooks[hookName] = preLogic as any;
	}
}

export function preReplaceHook (
    m: FxOrmModel.Model,
    opts: FxOrmModel.ModelDefineOptions,
    hookName: keyof FxOrmModel.Hooks,
    cb: (this: FxOrmInstance.Instance, inst: FxOrmInstance.Instance) => void
): void {
    var _oldHook: FxOrmHook.HookActionCallback | FxOrmHook.HookResultCallback;
    if (opts !== undefined && opts.hooks)
        _oldHook = opts.hooks[hookName] as typeof _oldHook;

    m[hookName](function (this: FxOrmInstance.Instance, next: any) {
        cb.call(this, this);

        if (_oldHook) {
            if (_oldHook.length > 0) {
                if (typeof next === 'boolean')
                    return (_oldHook as FxOrmHook.HookResultCallback).call(this, next);
                else
                    return (_oldHook as FxOrmHook.HookActionCallback).call(this, next);
            }
            _oldHook.call(this);
        }

        if (typeof next === 'function')
            next.call(this);
    });
}

export const hookTrigger = Hook.trigger
export const hookWait = Hook.wait
/* hooks: end */

/* arguments input :start */
export function selectArgs (
    args: ArrayLike<any>,
    callback: {
       (
          arg_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function",
          arg: any,
          idx: number
       ): void
    }
 ): void {
    // copy slice to ensure loop idx is correct
    args = Array.prototype.slice.apply(args);
    
    for (let i = 0, arg: any = null; i < args.length; i++) {
        arg = args[i]
        callback(typeof arg, arg, i);
    }
}
/* arguments input :end */

/* singleton helpers: start */
export function parseDriverUidAndTableNameFromUID (uid: string) {
	uid = uid || ''
	
	const arr = uid.split('/');
	
	return {
		driver_uid: arr[0],
		table: arr[1],
		driver_table_uid: Utilities.makeIdForDriverTable(arr[0], arr[1])
	}
}
/* singleton helpers: end */
export function valueOrComputeFunction <T = Exclude<any, Function>> (
    input: T | ((...args: any[]) => T),
    args?: any[],
    thisArg?: any
 ): T {
    if (typeof input === 'function')
        return input.apply(thisArg, args)

    return input
}
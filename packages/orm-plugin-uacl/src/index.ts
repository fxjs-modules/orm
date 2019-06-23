import { ACLNode, ACLTree } from './acl-tree';

import { Helpers } from '@fxjs/orm'
import { findACLNode } from './_utils';

function attachMethodsToModel (m_opts: FxOrmModel.ModelDefineOptions) {
    m_opts.methods = m_opts.methods || {};
    if (typeof m_opts.methods.$getUacis !== 'function')
        m_opts.methods.$getUacis = function ({
            prefix = ''
        }: {
            prefix?: string
        } = {}) {
            prefix = prefix || this.$uaclPrefix() || ''

            return {
                objectless: `${prefix}/${this.model().table}/0`,
                object: `${prefix}/${this.model().table}/${this.id}`,
                id: this.id
            }
        }

    if (typeof m_opts.methods.$uaclPrefix !== 'function')
        m_opts.methods.$uaclPrefix = function (value?: string) {
            const key = '$__uaclPrefix'

            if (value === undefined)
                return this[key] || ''
            
            if (!value)
                throw `[$uaclPrefix] value must be an non-empty string`

            if (!this.hasOwnProperty(key))
                Object.defineProperty(this, key, {
                    value: value,
                    enumerable: false,
                    writable: false,
                    configurable: true
                })
        }
}
/**
 * 
 * @sample 
 *  - instance.$uacl(): get acl via instance -> orm --> aclTree.getNode[INSTANCE/ID]
 *  - model.$uacl(): get acl via model -> orm --> aclTree.getNode[INSTANCE/0]
 *  - model.$uacl(id): get acl via model -> orm --> aclTree.getNode[INSTANCE/ID]
 *  - association.$uacl({pinstance?, instance?}): get acl via association -> aclTree.getNode[P_INSTANCE/PID/INSTANCE/ID]
 */

function UACLTreeGenerator (
    // this: FxOrmInstance.Instance,
    this: any,
    { uid = '', role = '', orm = null }: {
        uid: string,
        role: string,
        orm: FxOrmPluginUACLOptions['orm']
    }
): FxORMPluginUACLNS.ACLTree {
    if (!orm)
        throw `[UACLTreeGenerator] orm is required`
    if (!uid && !role)
        throw `[UACLTreeGenerator] there must be existed at least one in uid or role`

    const initialData = {
        type: null as FxORMPluginUACLNS.ACLTree['type'],
        get name () {
            return this.type === 'user' ? uid : role
        }
    }
    
    initialData.type = !!uid ? 'user' : null
    if (!initialData.type)
        initialData.type = !!role ? 'role' : null

    const key = `uaclTree$${initialData.type}$${initialData.name}`
    if (!orm.hasOwnProperty(key))
        Object.defineProperty(orm, key, {
            value: new ACLTree({
                name: initialData.name,
                type: initialData.type
            }),
            configurable: false,
            writable: false,
            enumerable: false
        })

    return orm[key]
}

function UACLConstructorGenerator (orm: FxOrmNS.ORM) {
    return function (cfg: any) {
        cfg = {...cfg}
        cfg.orm = orm
        return UACLTreeGenerator(cfg)
    }
}

const Plugin: FxOrmPluginUACL = function (orm, plugin_opts) {
    plugin_opts = plugin_opts || {};

    const { orm: UACLOrm = orm } = plugin_opts;

    UACLOrm.defineType('uacl:field_array', {
        datastoreType (prop) {
            return 'text'
        },
        valueToProperty (value, prop) {
            if (Array.isArray(value)) {
                return value;
            } else {
                return value.split(',')
            }
        },
        propertyToValue (value, prop) {
            return value.join(',')
        }
    })

    // enable connection pool for UACL's orm
    UACLOrm.settings.set('connection.pool', true)

    const ModelUACL = UACLOrm.define('uacl', {
        uacl_id: {
            type: 'text',
            required: true,
            key: true,
            primary: false
        },
        action: {
            type: 'text',
            required: true,
            key: false,
            primary: false,
            // @enum: ['read', 'write', 'delete']
            defaultValue: 'read'
        },
        allowed: {
            type: 'boolean',
            required: true,
            key: false,
            primary: false
        },
        fields: {
            type: 'uacl:field_array',
            required: true,
            key: false,
            primary: false,
            defaultValue: []
        }
    }, {
        id: ['uacl_id']
    })

    const uacl_models_config = new Map<FxOrmModel.Model['name'], {
        userModel: FxOrmModel.Model,
        roleModel: FxOrmModel.Model
    }>()

    const defaultUserModel = () => orm.models.user
    const defaultRoleModel = () => orm.models.role

    return {
        beforeDefine (name, props, m_opts) {
            attachMethodsToModel(m_opts)

            if (!m_opts.uacl)
                return ;

            m_opts.uacl = { ...m_opts.uacl };

            uacl_models_config.set(name, {
                userModel: Helpers.valueOrComputeFunction(m_opts.userModel || defaultUserModel),
                roleModel: Helpers.valueOrComputeFunction(m_opts.roleModel || defaultRoleModel),
            });
        },
        define (model) {
            if ([ModelUACL].includes(model))
                return ;

            if (!uacl_models_config.has(model.name))
                return ;

            model.afterLoad(function () {
                if (!this.$uacl)
                    Object.defineProperty(this, '$uacl', {
                        value: UACLConstructorGenerator(orm).bind(this),
                        writable: false,
                        configurable: false,
                        enumerable: false
                    })
            }, { oldhook: 'prepend' })
        }
    }
};

export = Plugin
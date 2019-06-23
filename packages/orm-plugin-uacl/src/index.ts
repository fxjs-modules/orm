import { ACLNode, ACLTree } from './acl-tree';

import { Helpers } from '@fxjs/orm'
import { arraify } from './_utils';

function attachMethodsToModel (m_opts: FxOrmModel.ModelDefineOptions) {
    m_opts.methods = m_opts.methods || {};
    if (typeof m_opts.methods.$getUacis !== 'function')
        m_opts.methods.$getUacis = function () {
            return {
                objectless: `${this.model().table}/0`,
                object: `${this.model().table}/${this.id}`,
                id: this.id
            }
        }
}

/**
 * @chainapi
 * @purpose record the relations, and provide the `uaci` computation by getUacis
 * 
 */
function instanceUacl (
    this: FxOrmInstance.Instance,
    association_name?: string
): ACLTree {
    const model = this.model()
    if (association_name && !model.associations.hasOwnProperty(association_name))
        throw `association name must be valid for model ${model.name}`

    const treeKey = `$uaclGrantTrees$${association_name}`
    if (!this[treeKey]) {
        const uacis = this.$getUacis()
        Object.defineProperty(this, treeKey, {
            value: new ACLTree({
                instance: this,
                namespace: `${uacis.object}`,
                association_name: association_name
            }),

            configurable: false,
            writable: false,
            enumerable: false
        });
    }

    return this[treeKey]
}

const Plugin: FxOrmPluginUACL = function (orm, plugin_opts) {
    plugin_opts = plugin_opts || {};

    orm.ACLTree = ACLTree;
    orm.ACLNode = ACLNode;

    orm.defineType('uacl:field_array', {
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

    const ModelUACL = orm.define('uacl', {
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
        // beforeHasOne (model, {association_name, ext_model, assoc_options}) {
        //     if (ext_model !== ModelUACL)
        //         return ;

        //     assoc_options.hooks = assoc_options.hooks || {};
        //     assoc_options.hooks['beforeSet'] = arraify(assoc_options.hooks['beforeSet']).filter(x => x)
        //     assoc_options.hooks['afterSet'] = arraify(assoc_options.hooks['afterSet']).filter(x => x)

        //     assoc_options.hooks['afterSet'].push(() => {
        //         // console.log('I set?')
        //     })
        // },
        define (model) {
            if ([ModelUACL].includes(model))
                return ;

            if (!uacl_models_config.has(model.name))
                return ;

            const config = uacl_models_config.get(model.name)

            model.afterLoad(function () {
                if (!this.$uacl)
                    Object.defineProperty(this, '$uacl', {
                        value: instanceUacl.bind(this),
                        writable: false,
                        configurable: false,
                        enumerable: false
                    })
            }, { oldhook: 'prepend' })

            // model.hasOne('uacl', ModelUACL, {
            //     field: 'uacl_id'
            // });

            // model.afterSave(function (success) {
            //     if (!success)
            //         return ;
            // }, { oldhook: 'append' })
        }
    }
};

export = Plugin
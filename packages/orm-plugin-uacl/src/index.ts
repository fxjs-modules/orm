import { ACLNode, ACLTree } from './acl-tree';

/**
 * @chainapi
 * @purpose record the relations, and provide the `uaci` computation by getUaci
 * 
 */
function modelUacl (
    this: FxOrmModel.Model,
    association_name: string
): ACLTree {
    if (!this.$uaclGrantTree) {
        const model = this;
        this.$uaclGrantTree = new ACLTree({
            model: model,
            prefix: `${model.table}`,
            association_name,
        })
    }

    return this.$uaclGrantTree
}


/**
 * @chainapi
 * @purpose record the relations, and provide the `uaci` computation by getUaci
 * 
 */
function instanceUacl (
    this: FxOrmInstance.Instance,
    association_name: string
): ACLTree {
    const model = this.model()
    if (!model.associations.hasOwnProperty(association_name))
        throw `association name must be valid for model ${model.name}`

    const treeKey = `$uaclGrantTrees$${association_name}`
    if (!this[treeKey]) {
        this[treeKey] = new ACLTree({
            model: model,
            prefix: `${model.table}`,
            association_name: association_name
        })
    }

    return this[treeKey]
}

const Plugin: FxOrmPluginUACL = function (orm, opts) {
    opts = opts || {};

    orm.ACLTree = ACLTree;
    orm.ACLNode = ACLNode;

    return {
        beforeDefine (name, props, opts) {
            opts.ievents = opts.ievents || {};

            opts.methods = opts.methods || {};
            if (typeof opts.methods.$getUaci !== 'function')
                opts.methods.$getUaci = function () {
                    return {
                        objectless: `${this.model().table}/0`,
                        object: `${this.model().table}/${this.id}`
                    }
                }
        },
        define (model) {
            model.uacl = modelUacl.bind(model)

            model.afterLoad(function () {
                Object.defineProperty(this, '$uacl', {
                    value: instanceUacl.bind(this),
                    writable: false,
                    configurable: false,
                    enumerable: false
                })
            }, { oldhook: 'prepend' })
        }
    }
};

export = Plugin
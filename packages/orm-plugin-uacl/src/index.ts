import { ACLNode, ACLTree } from './acl-tree';

/**
 * @chainapi
 * @purpose record the relations, and provide the `uaci` computation by getUacis
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
        const uacis = this.$getUacis()
        this[treeKey] = new ACLTree({
            model: model,
            prefix: `${uacis.object}`,
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
            if (typeof opts.methods.$getUacis !== 'function')
                opts.methods.$getUacis = function () {
                    return {
                        objectless: `${this.model().table}/0`,
                        object: `${this.model().table}/${this.id}`,
                        id: this.id
                    }
                }
        },
        define (model) {
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
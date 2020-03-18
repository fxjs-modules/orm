const util = require("util");
const FibPool = require("fib-pool");
const orm_1 = require("@fxjs/orm");
const ORM = require("@fxjs/orm");
const acl_tree_1 = require("./acl-tree");
const config_acl_tree_1 = require("./config-acl-tree");
const _utils_1 = require("./_utils");
function attachMethodsToModel(m_opts) {
    m_opts.methods = m_opts.methods || {};
    if (typeof m_opts.methods.$getUacis !== 'function')
        m_opts.methods.$getUacis = function ({ prefix = '' } = {}) {
            prefix = prefix || this.$uaclPrefix() || '';
            if (!this.id)
                throw Error(`instance's id is required`);
            return {
                objectless: `${prefix}/${this.model().table}/0`,
                object: `${prefix}/${this.model().table}/${this.id}`,
                id: this.id
            };
        };
    if (typeof m_opts.methods.$uaclPrefix !== 'function')
        m_opts.methods.$uaclPrefix = function (value) {
            const key = '$__uaclPrefix';
            if (value === undefined)
                return this[key] || '';
            if (!value)
                throw `[$uaclPrefix] value must be an non-empty string`;
            if (!this.hasOwnProperty(key))
                Object.defineProperty(this, key, {
                    value: value,
                    enumerable: false,
                    writable: false,
                    configurable: true
                });
        };
}
/**
 *
 * @sample
 *  - instance.$uacl(): get acl via instance -> orm --> aclTree.getNode[INSTANCE/ID]
 *  - model.$uacl(): get acl via model -> orm --> aclTree.getNode[INSTANCE/0]
 *  - model.$uacl(id): get acl via model -> orm --> aclTree.getNode[INSTANCE/ID]
 *  - association.$uacl({pinstance?, instance?}): get acl via association -> aclTree.getNode[P_INSTANCE/PID/INSTANCE/ID]
 */
function UACLTreeGenerator({ uid = '', role = '', orm = null, pool = null }) {
    if (!orm)
        throw Error(`[UACLTreeGenerator] orm is required`);
    if (!uid && !role)
        throw Error(`[UACLTreeGenerator] there must be existed at least one in uid or role`);
    const initialData = {
        type: null,
        get name() {
            return this.type === 'user' ? uid : role;
        }
    };
    initialData.type = !!uid ? 'user' : null;
    if (!initialData.type)
        initialData.type = !!role ? 'role' : null;
    const treeName = _utils_1.encodeGrantTareget(initialData.type, initialData.name);
    if (pool) {
        return (cb) => pool(treeName, cb);
    }
    if (!orm.hasOwnProperty('_uaclTreeStores'))
        Object.defineProperty(orm, '_uaclTreeStores', {
            value: new util.LruCache(10000, 30 * 1e3),
            configurable: false,
            writable: false,
            enumerable: false
        });
    const _uaclTreeStores = orm._uaclTreeStores;
    if (!_uaclTreeStores.has(treeName))
        _uaclTreeStores.set(treeName, new acl_tree_1.ACLTree({
            name: initialData.name,
            type: initialData.type,
            configStorageServiceRouting: config_acl_tree_1.getConfigStorageServiceRouting({ orm })
        }));
    return _uaclTreeStores.get(treeName);
}
function UACLConstructorGenerator(uaclORM, pool) {
    return function (cfg) {
        cfg = Object.assign({}, cfg);
        cfg.orm = uaclORM;
        cfg.pool = pool;
        return UACLTreeGenerator(cfg);
    };
}
const Plugin = function (orm, plugin_opts) {
    plugin_opts = plugin_opts || {};
    const { defineUACLInMainORM = true } = plugin_opts;
    const { orm: UACLOrm = ORM.connectSync(Object.assign({}, orm.driver.config, { pool: {} })) } = plugin_opts;
    if (orm === UACLOrm)
        throw Error(`UACLOrm cannot be orm`);
    if (defineUACLInMainORM) {
        config_acl_tree_1.configUACLOrm(orm);
    }
    config_acl_tree_1.configUACLOrm(UACLOrm);
    const uacl_models_config = new Map();
    const defaultUserModel = () => orm.models.user;
    const defaultRoleModel = () => orm.models.role;
    const uaclPool = FibPool({
        create: (treeName) => {
            const { id, type } = _utils_1.decodeGrantTareget(treeName);
            return new acl_tree_1.ACLTree({
                name: id,
                type: type,
                configStorageServiceRouting: config_acl_tree_1.getConfigStorageServiceRouting({ orm: UACLOrm })
            });
        },
        destroy: (tree) => {
            tree.reset();
        },
        timeout: 30 * 1000,
        maxsize: 1000
    });
    const [$uacl, $uaclPool] = [
        UACLConstructorGenerator(UACLOrm),
        UACLConstructorGenerator(UACLOrm, uaclPool)
    ];
    return {
        beforeDefine(name, props, m_opts) {
            attachMethodsToModel(m_opts);
            if (!m_opts.uacl)
                return;
            const uaclCfg = m_opts.uacl = Object.assign({}, m_opts.uacl);
            uacl_models_config.set(name, {
                userModel: orm_1.Helpers.valueOrComputeFunction(uaclCfg.userModel || defaultUserModel),
                roleModel: orm_1.Helpers.valueOrComputeFunction(uaclCfg.roleModel || defaultRoleModel),
            });
        },
        define(model) {
            if ([UACLOrm.models.uacl].includes(model))
                return;
            if (!uacl_models_config.has(model.name))
                return;
            model.afterLoad(function () {
                if (!this.$uacl)
                    Object.defineProperty(this, '$uacl', {
                        value: $uacl,
                        writable: false,
                        configurable: false,
                        enumerable: false
                    });
                if (!this.$uaclPool)
                    Object.defineProperty(this, '$uaclPool', {
                        value: $uaclPool,
                        writable: false,
                        configurable: false,
                        enumerable: false
                    });
            }, { oldhook: 'prepend' });
        }
    };
};
module.exports = Plugin;

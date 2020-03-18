Object.defineProperty(exports, "__esModule", { value: true });
const coroutine = require("coroutine");
const util = require("util");
const assert = require("assert");
const uuid = require("uuid");
const UTILS = require("./_utils");
function defineORMTypes(targetORM) {
    targetORM.defineType('tuacl:uaci', {
        datastoreType(prop) {
            return 'text';
        },
        valueToProperty(value, prop) {
            return value + '';
        },
        propertyToValue(value, prop) {
            return value + '';
        }
    });
    targetORM.defineType('tuacl:boolean', {
        datastoreType(prop) {
            return 'INT';
        },
        valueToProperty(value, prop) {
            if (typeof value === 'boolean')
                return value;
            return value + '' !== '0' ? true : false;
        },
        propertyToValue(value, prop) {
            return !!value ? 1 : 0;
        }
    });
    targetORM.defineType('tuacl:grant_target', {
        datastoreType(prop) {
            return 'text';
        },
        valueToProperty(value, prop) {
            if (util.isBuffer(value))
                value = value + '';
            else if (util.isObject(value))
                return value;
            let type, id;
            try {
                const target = UTILS.decodeGrantTareget(value);
                type = target.type;
                id = target.id;
            }
            catch (error) { }
            if (!['user', 'role'].includes(type))
                type = 'user';
            id = id || 0;
            return { type, id };
        },
        propertyToValue(value, prop) {
            if (!value || typeof value !== 'object')
                throw `[typedef@tuacl:grant_target] value must be object`;
            if (!value.hasOwnProperty('type'))
                throw `[typedef@tuacl:grant_target] type missing in value object`;
            if (!value.hasOwnProperty('id'))
                throw `[typedef@tuacl:grant_target] id missing in value object`;
            return UTILS.encodeGrantTareget(value.type, value.id);
        }
    });
    targetORM.defineType('tuacl:field_array', {
        datastoreType(prop) {
            return 'text';
        },
        valueToProperty(value, prop) {
            if (Array.isArray(value)) {
                return value;
            }
            // TODO: add more test
            try {
                return value.split(',');
            }
            catch (error) {
                return [];
            }
        },
        propertyToValue(value, prop) {
            return value.join(',');
        }
    });
    targetORM.defineType('tuacl:boolean_or_allowed_fields', {
        datastoreType(prop) {
            return 'text';
        },
        valueToProperty(value, prop) {
            if (util.isArray(value) || util.isBoolean(value))
                return value;
            let val = false;
            try {
                val = JSON.parse(value);
            }
            catch (error) {
            }
            return val;
        },
        propertyToValue(value, prop) {
            let val = null;
            val = JSON.stringify(value);
            if (!util.isString(val) && !util.isBoolean(val))
                val = false;
            return val;
        }
    });
}
function configUACLOrm(targetORM) {
    // enable connection pool for UACL's orm
    defineORMTypes(targetORM);
    targetORM.define('uacl', {
        uacl_id: {
            type: 'text',
            key: true,
            primary: true
        },
        uaci: {
            type: 'tuacl:uaci',
            required: true,
            key: false,
            primary: true
        },
        target: {
            type: 'tuacl:grant_target',
            required: true,
            key: false,
        },
        depth: {
            type: 'number',
            required: false,
            key: false
        },
        is_wild: {
            type: 'tuacl:boolean',
            required: false,
            key: false
        },
        /**
         * @example for uaci='project/0', means could find/read
         * @example for uaci='project/1', means could read
         */
        read: {
            type: 'tuacl:boolean_or_allowed_fields',
            mapsTo: 'ac_read',
            required: true,
            defaultValue: false
        },
        /**
         * @example for uaci='project/0', means could create
         * @example for uaci='project/1', means could update(patch/replace)
         */
        write: {
            type: 'tuacl:boolean_or_allowed_fields',
            mapsTo: 'ac_write',
            required: true,
            defaultValue: false
        },
        /**
         * @example for uaci='project/0', means could clear
         * @example for uaci='project/1', means could remove
         */
        delete: {
            type: 'tuacl:boolean_or_allowed_fields',
            mapsTo: 'ac_delete',
            required: true,
            defaultValue: false
        },
        allowed_actions: {
            type: 'tuacl:field_array',
            mapsTo: 'ac_allowed_actions',
            required: true,
            key: false,
            primary: false,
            defaultValue: []
        }
    }, {
        id: ['uacl_id'],
        hooks: {
            beforeCreate() {
                this.uacl_id = uuid.snowflake().hex();
            },
            beforeSave() {
                this.depth = UTILS.compuateUaciDepth(this.uaci);
                this.is_wild = UTILS.isUaciWild(this.uaci);
            }
        }
    });
    targetORM.syncSync();
}
exports.configUACLOrm = configUACLOrm;
const VERBS = [
    'GRANT',
    'QUERY',
    'REVOKE',
    'REVOKE_BY_ROLE',
    'REVOKE_BY_UACI',
    'REVOKE_BY_UID'
];
const VIAS = ['user', 'role'];
let GRANT_ERRCODE_COUNT = 1;
exports.GRANT_ERRCODE = {
    'UNMATCHED_ROUTE': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: `verb must match with route`
    },
    'INVALID_VERB': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: `verb must in ${VERBS}`
    },
    'INVALID_DATE': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'date must be GMT string'
    },
    'INVALID_VIA': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: `via must one of ${VIAS}`
    },
    'INVALID_UIDS': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'uids must be non-empty string list'
    },
    'INVALID_ROLES': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'uids must be non-empty string list'
    },
    'INVALID_ROUTE_MODEL_NAME': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'model name is required!'
    },
    'INVALID_ROUTE_MODEL_ID': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'model id is required!'
    },
    'INVALID_ROUTE_SUB_MODEL_NAME': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'sub model name is required!'
    },
    'INVALID_ROUTE_SUB_MODEL_ID': {
        code: 4030000 + GRANT_ERRCODE_COUNT++,
        message: 'sub model id is required!'
    },
};
function getACLMessageResult({ code = '', data = null, msg = '', literalCode = null, error_data = null, error_msg = '', }) {
    return {
        success: literalCode ? null : {
            code,
            data,
            msg
        },
        error: !literalCode ? null : {
            code: literalCode,
            data: error_data,
            msg: error_msg
        }
    };
}
const payload_filter = (_msg) => {
    _msg.payload = _msg.json();
    _msg.json({ success: { code: 'pending', data: null } });
    const { verb = null } = _msg.payload;
    if (!VERBS.includes(verb)) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_VERB',
            error_msg: exports.GRANT_ERRCODE['INVALID_VERB'].message
        }));
        _msg.end();
    }
    // if (_msg.payload.via && !['user', 'role'].includes(_msg.payload.via)) {
    //     _msg.json(getACLMessageResult({
    //         literalCode: 'INVALID_VIA',
    //         error_msg: GRANT_ERRCODE['INVALID_VIA'].message
    //     }))
    //     _msg.end()
    // }
    if (!_msg.payload.date || typeof _msg.payload.date !== 'string') {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_DATE',
            error_msg: exports.GRANT_ERRCODE['INVALID_DATE'].message
        }));
        _msg.end();
    }
    else {
        _msg.payload.date = new Date(_msg.payload.date);
    }
    _msg.payload.uids = _msg.payload.uids || [];
    if (_msg.payload.uids && !Array.isArray(_msg.payload.uids)) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_UIDS',
            error_msg: exports.GRANT_ERRCODE['INVALID_UIDS'].message
        }));
        _msg.end();
    }
    _msg.payload.roles = _msg.payload.roles || [];
    if (_msg.payload.uids && !Array.isArray(_msg.payload.roles)) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_ROLES',
            error_msg: exports.GRANT_ERRCODE['INVALID_ROLES'].message
        }));
        _msg.end();
    }
};
const level1_filter = (_msg, model_name, id) => {
    if (!model_name) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_ROUTE_MODEL_NAME',
            error_msg: exports.GRANT_ERRCODE['INVALID_ROUTE_MODEL_NAME'].message
        }));
        _msg.end();
        return;
    }
    if (!id) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_ROUTE_MODEL_ID',
            error_msg: exports.GRANT_ERRCODE['INVALID_ROUTE_MODEL_ID'].message
        }));
        _msg.end();
        return;
    }
};
const level2_filter = (_msg, model_name, id, association_name, aid) => {
    if (!association_name) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_ROUTE_SUB_MODEL_NAME',
            error_msg: exports.GRANT_ERRCODE['INVALID_ROUTE_SUB_MODEL_NAME'].message
        }));
        _msg.end();
        return;
    }
    if (!aid) {
        _msg.json(getACLMessageResult({
            literalCode: 'INVALID_ROUTE_SUB_MODEL_ID',
            error_msg: exports.GRANT_ERRCODE['INVALID_ROUTE_SUB_MODEL_ID'].message
        }));
        _msg.end();
        return;
    }
};
exports.getConfigStorageServiceRouting = ({ orm = null }) => {
    assert.exist(orm, `[getConfigStorageServiceRouting] orm for uacl is required`);
    // uacl model
    assert.property(orm.models, 'uacl', `[getConfigStorageServiceRouting] model 'uacl' is required`);
    const app_filter = (_msg, model_name, id, association_name, aid) => {
        const { verb, uids, roles } = _msg.payload;
        let { uacis = [], oacl } = _msg.payload;
        let batchQuery = false;
        let uaci = `/${model_name}/${id}`;
        if (association_name && aid)
            uaci += `/${association_name}/${aid}`;
        oacl = Object.assign({}, oacl);
        if (!model_name)
            batchQuery = true;
        else
            uacis = UTILS.arraify(uaci);
        switch (verb) {
            case 'GRANT': {
                exec(() => {
                    const items = []
                        .concat(uids.map(uid => ({
                        uaci,
                        target: UTILS.encodeGrantTareget('user', uid),
                        read: oacl.read,
                        write: oacl.write,
                        delete: oacl.delete
                    })))
                        .concat(roles.map(role => ({
                        uaci,
                        target: UTILS.encodeGrantTareget('role', role),
                        read: oacl.read,
                        write: oacl.write,
                        delete: oacl.delete
                    })));
                    let err;
                    let uaclItems = [];
                    try {
                        uaclItems = coroutine.parallel(items, (raw) => {
                            const target = UTILS.decodeGrantTareget(raw.target);
                            let instance = orm.models.uacl.findSync({
                                uaci: raw.uaci,
                                target: raw.target
                            })[0];
                            if (!instance) {
                                instance = orm.models.uacl.createSync(Object.assign({}, raw, { target: target }));
                            }
                            else {
                                instance.saveSync();
                            }
                            return instance;
                        });
                    }
                    catch (error) {
                        err = error;
                        uaclItems = [];
                    }
                    if (!err)
                        _msg.json(getACLMessageResult({
                            data: uaclItems,
                            msg: 'grant success!'
                        }));
                    else
                        _msg.json(getACLMessageResult({
                            literalCode: 'DB_OPERATION_ERROR',
                            msg: err.message
                        }));
                    _msg.end();
                });
                break;
            }
            case 'QUERY': {
                exec(() => {
                    let err;
                    let uaclItems = [];
                    try {
                        uaclItems = orm.models.uacl.findSync({
                            uaci: uacis,
                            target: {
                                in: []
                                    .concat(uids.map(uid => UTILS.encodeGrantTareget('user', uid)))
                                    .concat(roles.map(role => UTILS.encodeGrantTareget('role', role)))
                            }
                        });
                    }
                    catch (error) {
                        err = error;
                    }
                    if (!err)
                        _msg.json(getACLMessageResult({
                            data: uaclItems,
                            msg: 'query success!'
                        }));
                    else
                        _msg.json(getACLMessageResult({
                            literalCode: 'DB_OPERATION_ERROR',
                            msg: err.message
                        }));
                    _msg.end();
                });
                break;
            }
            case 'REVOKE_BY_UACI': {
                exec(() => {
                    let err = null, uaclItems = null;
                    try {
                        orm.models.uacl.where({
                            uaci: uacis,
                            target: {
                                in: []
                                    .concat(uids.map(uid => UTILS.encodeGrantTareget('user', uid)))
                                    .concat(roles.map(role => UTILS.encodeGrantTareget('role', role)))
                            }
                        })
                            .removeSync();
                    }
                    catch (error) {
                        err = error;
                    }
                    if (!err)
                        _msg.json(getACLMessageResult({
                            data: uaclItems,
                            msg: 'revoke success!'
                        }));
                    else
                        _msg.json(getACLMessageResult({
                            literalCode: 'DB_OPERATION_ERROR',
                            error_msg: err.message
                        }));
                    _msg.end();
                });
                break;
            }
        }
    };
    return ({ tree }) => {
        return {
            '/:model_name/:id/:association_name/:aid': [
                payload_filter,
                level1_filter,
                level2_filter,
                app_filter
            ],
            '/:model_name/:id': [
                payload_filter,
                level1_filter,
                app_filter
            ],
            '/': [
                payload_filter,
                app_filter
            ]
        };
    };
};
function exec(fn) {
    fn();
}

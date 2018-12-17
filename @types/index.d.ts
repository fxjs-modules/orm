/// <reference types="fibjs" />
/// <reference types="@fibjs/enforce" />

/// <reference path="3rd.d.ts" />
/// <reference path="Error.d.ts" />
/// <reference path="Validators.d.ts" />

// fix fibjs types' missing
declare var console: any

declare namespace FxOrmNS {
    /* Connection About Patch :start */
    interface InstanceDataPayload {
        [key: string]: any
    }

    interface ExtensibleError extends Error {
        [extensibleProperty: string]: any
    }

    /**
     * it should be defined in 'orm' but there is not, so we should fix it
     */
    interface ConnInstanceInOrmConnDriverDB {
        begin(): void;
        close(): void;
        commit(): void;
        rollback(): void;
        trans(func: Function): boolean
        execute(sql: string, ...args: any[]): any[];

        hasMany?: Function;
        remove?: Function;

        propertyToValue?: Function;
        insert?: Function;
    }

    interface DbInstanceInOrmConnDriver {
        conn: ConnInstanceInOrmConnDriverDB
    }
    export interface OrigOrmExecQueryOpts {
        [key: string]: any;
    }
    export interface OrigOrmConnDriver {
        // dialog type
        dialect: string;
        propertyToValue: Function;
        valueToProperty: Function;
        insert: Function;
        db: DbInstanceInOrmConnDriver
    }
    /**
     * then we should patch still
     */
    export interface PatchedOrmConnDriver extends OrigOrmConnDriver {
        execQuerySync: (query: FxOrmNSSqlQueryNS.Query, opt: OrigOrmExecQueryOpts) => any
    }

    export interface OrmConnectionOpts {
    }
    /* Connection About Patch :end */

    interface ORMMethod__CommonCallback {
        (err: Error): void
    }

    interface TransformFibOrmModel2InstanceOptions extends ModelOptions {}

    export interface FibORM extends ORM {
        /* all fixed: start */
        models: { [key: string]: Model };

        use(plugin: string, options?: any): FibORM;
        use(plugin: Plugin, options?: any): FibORM;

        define(name: string, properties: { [key: string]: OrigModelPropertyDefinition }, opts?: ModelOptions): Model;
        ping(callback: ORMMethod__CommonCallback): FibORM;
        close(callback: ORMMethod__CommonCallback): FibORM;
        load(file: string, callback: ORMMethod__CommonCallback): any;
        sync(callback: ORMMethod__CommonCallback): FibORM;
        drop(callback: ORMMethod__CommonCallback): FibORM;
        /* all fixed: end */

        /* memeber patch: start */
        driver: PatchedOrmConnDriver
        begin: () => any
        commit: () => any
        rollback: () => any
        trans: (func: Function) => any

        syncSync(): void;

        [extraMember: string]: any;
        /* memeber patch: end */
    }
    // bad annotation but 'db' is used as like 'orm' ever, so we use 'FibOrmDB' to substitute FibORM
    type FibOrmDB = FibORM

    export interface FibORMIConnectionOptions extends IConnectionOptions {
        timezone: string;
    }

    type AssociationKeyComputation = Function | string
    interface AssociationDefinitionOptions {
        name?: string;
        model?: Model;
        field?: OrigDetailedModelProperty

        // is the association is extendsTo
        extension?: boolean;
        required?: boolean;
        reversed?: boolean;
        accessor?: string;
        reverseAccessor?: string;
        autoFetch?: boolean;
        autoFetchLimit?: number;
    }
    interface InstanceAssociationItem {
        name: string;
        field?: OrigDetailedModelProperty;
        // is the association is extendsTo
        extension?: boolean;

        getAccessor: string;
        setAccessor: string;
        hasAccessor: string;
        delAccessor: string;
        addAccessor?: string;

        model: Model;
        reversed?: boolean;
        autoFetch: boolean;
        autoFetchLimit: number
    }

    interface AssociationDefinitionOptions_HasOne extends AssociationDefinitionOptions {
        reverse?: string;
    }
    interface AssociationDefinitionOptions_HasMany extends AssociationDefinitionOptions {
        reverse?: string;
        // is association property a primary key
        key?: boolean
        mergeId?: string
        mergeAssocId?: string
        reverseAssociation?: string

        hooks?: HasManyHooks
        mergeTable?: string

        association?: string

        getAccessor?: string;
        setAccessor?: string;
        hasAccessor?: string;
        delAccessor?: string;
        addAccessor?: string;
    }
    interface InstanceAssociationItem_ExtendTos extends InstanceAssociationItem {
        field: OrigDetailedModelProperty;
        table: string;
    }

    interface InstanceAssociationItem_HasOne extends InstanceAssociationItem {
        field?: OrigDetailedModelProperty;
        reverse?: string;
        // template name
        accessor?: string;
        reverseAccessor?: string;

        addAccessor?: string;

        required?: boolean;
        extension?: boolean;
        mapsTo?: {
            [key: string]: any;
        }
    }

    interface InstanceAssociationItem_HasMany extends InstanceAssociationItem {
        props: ResolvedModelPropertyDefinitionHash
        hooks: Hooks
        field?: OrigDetailedModelProperty

        mergeTable: string
        mergeId: string
        mergeAssocId: string

        getAccessor: string
        setAccessor: string
        hasAccessor: string
        delAccessor: string
        addAccessor: string
    }

    interface InnerInstanceOptions extends ModelOptions {
        one_associations: InstanceAssociationItem_HasOne[]
        many_associations: InstanceAssociationItem_HasMany[]
        extend_associations: InstanceAssociationItem_ExtendTos[]
        association_properties: any
        fieldToPropertyMap: any

        associations?: InnerInstanceOptionsAssociationInfoItem[]
    }

    // for compability
    type InstanceOptions = InnerInstanceOptions

    interface InnerInstanceOptionsAssociationInfoItem {
        value: any
        changed: boolean
    }

    interface PatchedSyncfiedModelOrInstance {
        /**
         * @important
         * 
         * methods patchSyncfied by 'fib-orm'
         */
        countSync: Function;
        firstSync: Function;
        lastSync: Function;
        allSync: Function;
        whereSync: Function;
        findSync: Function;
        removeSync: Function;
        runSync: Function;
    }

    interface PatchedSyncfiedInstanceWithDbWriteOperation extends PatchedSyncfiedModelOrInstance {
        saveSync: Function;
        removeSync: Function;
        validateSync: Function;
        modelSync: Function;
    }
    interface PatchedSyncfiedInstanceWithAssociations {
        /**
         * generated by association, but you don't know what it is
         */
        /* getXxx: Function; */
        /* setXxx: Function; */
        /* removeXxx: Function; */

        /* findByXxx: Function; */
        [associationFunc: string]: Function;
    }

    interface ModelPropertyDefinition {
        // ?
        name?: string
        /**
         * text | number | integer | boolean | date | enum | object | <del>point</del> | binary | serial
         * view details in https://github.com/dresende/node-orm2/wiki/Model-Properties
         */
        type: string
        // has unique constrain
        unique?: boolean
        // is primary key
        key?: boolean
        // is required
        required?: boolean


        defaultValue?: any

        unsigned?: boolean
        size?: number
        values?: any[]
        time?: boolean
        big?: boolean

        mapsTo?: string

        alwaysValidate?: boolean
        enumerable?: boolean
    }

    // @deprecated, for compatibility
    type OrigDetailedModelProperty = ModelPropertyDefinition


    // TODO: finish that 
    interface InstanceProperty extends ModelPropertyDefinition {
    }
    type ComplexModelPropertyDefinition = ModelPropertyDefinition |
        String | Boolean | Number | Date | Class_Buffer | any[]
    // for compatibility
    type OrigModelPropertyDefinition = ComplexModelPropertyDefinition

    interface ModelPropertyDefinitionHash {
        [key: string]: ComplexModelPropertyDefinition
    }
    interface ResolvedModelPropertyDefinitionHash {
        [key: string]: ModelPropertyDefinition
    }

    type OrigAggreteGenerator = (...args: any[]) => IAggregated
    interface OrigHooks extends Hooks {
        afterAutoFetch?: (next?) => void
    }

    export interface ExtendModelWrapper {
        // 'hasOne', 'hasMany'
        type: string;
        reversed?: boolean;
        model: FibOrmFixedExtendModel;
    }

    export interface FibOrmFixedExtendModel extends Model {
        model_name: string;
    }

    export interface FibOrmFindLikeQueryObject {
        [key: string]: any;
    }

    export interface FibOrmFixedModelInstanceFn {
        (model: Model, opts: object): Instance
        new(model: Model, opts: object): Instance
    }

    export interface FibOrmPatchedSyncfiedInstantce extends PatchedSyncfiedInstanceWithDbWriteOperation, PatchedSyncfiedInstanceWithAssociations {
    }

    export interface IChainFibORMFind extends PatchedSyncfiedModelOrInstance, FxOrmNSSqlQueryNS.SelectQuery {
        only(args: string | string[]): IChainFibORMFind;
        only(...args: string[]): IChainFibORMFind;
        order(...order: string[]): IChainFibORMFind;
    }
    /* Orm About Patch :end */

    /* instance/model computation/transform about :start */
    export interface ModelAutoFetchOptions {
        autoFetchLimit?: number
        autoFetch?: boolean
    }

    export interface InstanceAutoFetchOptions extends ModelAutoFetchOptions {
    }

    export interface ModelExtendOptions {

    }
    export interface InstanceExtendOptions extends ModelExtendOptions {

    }
    /* instance/model computation/transform about :end */

    /* query conditions :start */
    type QueryConditionInTypeType = string | number

    type QueryCondition_SimpleEq = { [key: string]: any }

    type QueryCondition_eq = QueryCondition_SimpleEq | { [key: string]: { "eq": any } }
    type QueryCondition_ne = { [key: string]: { "ne": any } }
    type QueryCondition_gt = { [key: string]: { "gt": number } }
    type QueryCondition_gte = { [key: string]: { "gte": number } }
    type QueryCondition_lt = { [key: string]: { "lt": number } }
    type QueryCondition_lte = { [key: string]: { "lte": number } }
    type QueryCondition_like = { [key: string]: { "like": string } }
    type QueryCondition_not_like = { [key: string]: { "not_like": string } }
    type QueryCondition_between = { [key: string]: { "between": [number, number] } }
    type QueryCondition_not_between = { [key: string]: { "not_between": [number, number] } }

    type QueryCondition_in = { [key: string]: { "in": QueryConditionInTypeType[] } }
    type QueryCondition_not_in = { [key: string]: { "not_in": QueryConditionInTypeType[] } }

    type QueryConditionAtomicType =
        QueryCondition_eq |
        QueryCondition_ne |
        QueryCondition_gt |
        QueryCondition_gte |
        QueryCondition_lt |
        QueryCondition_lte |
        QueryCondition_like |
        QueryCondition_not_like |
        QueryCondition_between |
        QueryCondition_not_between |
        QueryCondition_in |
        QueryCondition_not_in

    interface QueryConditions {
        or?: QueryConditionAtomicType[]
        [query_field: string]: QueryConditionAtomicType
    }
    /* query conditions :end */

    /**
    * Parameter Type Interfaces
    **/

    interface ModelAssociationMethod__ComputationPayload__Merge {
        from: { table: string, field: string | string[] }
        to: { table: string, field: string | string[] }
        where: [string, ModelMethod__FindConditions]
        table?: string
    }

    export interface ModelMethod__FindOptions {
        limit?: number;
        order?: any;

        only?
        offset?: number;
    }

    export interface ModelAssociationMethod__Options {
        autoFetch: boolean
        cascadeRemove: boolean
        autoSave: boolean
        identityCache: boolean
        autoFetchLimit: number
        __merge: ModelAssociationMethod__ComputationPayload__Merge
        extra: ModelPropertyDefinitionHash | any[]
        extra_info: {
            table: string
            id: any
            id_prop
            assoc_prop
        }
    }

    export interface ModelAssociationMethod__FindOptions extends ModelMethod__FindOptions, ModelAssociationMethod__Options {

    }

    export interface ModelAssociationMethod__GetOptions extends ModelMethod__FindOptions, ModelAssociationMethod__Options {
    }

    export interface ModelMethod__FindConditions {
        [property: string]: any
    }


    export interface ModelMethod__CommonCallback {
        (err: Error, results: Instance[]): void
    }

    export interface ModelMethod__CountCallback {
        (err: Error, count?: number): void
    }

    export interface Model extends OrigHooks, PatchedSyncfiedModelOrInstance {
        (): Instance;
        (...ids: any[]): Instance;
        new(): Instance;
        new(...ids: any[]): Instance;

        properties: { [property: string]: OrigDetailedModelProperty };
        settings: SettingInstance;

        drop(callback?: (err: Error) => void): Model;
        sync(callback?: (err: Error) => void): Model;
        get(...args: any[]): Model;

        find(): any /* Model|IChainFind */;
        find(conditions: ModelMethod__FindConditions, callback?: ModelMethod__CommonCallback): Model;
        find(conditions: ModelMethod__FindConditions, options: ModelMethod__FindOptions, callback?: ModelMethod__CommonCallback): Model;
        find(conditions: ModelMethod__FindConditions, limit: number, order: string[], callback?: ModelMethod__CommonCallback): Model;
        find(conditions: ModelMethod__FindConditions): IChainFind;

        all(conditions: ModelMethod__FindConditions, callback?: ModelMethod__CommonCallback): Model;
        all(conditions: ModelMethod__FindConditions, options: ModelMethod__FindOptions, callback?: ModelMethod__CommonCallback): Model;
        all(conditions: ModelMethod__FindConditions, limit: number, order: string[], callback?: ModelMethod__CommonCallback): Model;

        one(conditions: ModelMethod__FindConditions, callback: (err: Error, result: Instance) => void): Model;
        one(conditions: ModelMethod__FindConditions, options: ModelMethod__FindOptions, callback: (err: Error, result: Instance) => void): Model;
        one(conditions: ModelMethod__FindConditions, limit: number, order: string[], callback: (err: Error, result: Instance) => void): Model;

        count(callback: ModelMethod__CountCallback): Model;
        count(conditions: ModelMethod__FindConditions, callback: ModelMethod__CountCallback): Model;

        aggregate(conditions: ModelMethod__FindConditions): IAggregated;
        aggregate(properties: string[]): IAggregated;
        aggregate(conditions: ModelMethod__FindConditions, properties: string[]): IAggregated;

        exists(id: any, callback: (err: Error, exists: boolean) => void): Model;
        exists(...args: any[]): Model;

        create(data: { [property: string]: any; }, callback: (err: Error, instance: Instance) => void): Model;
        create(...args: any[]): Model;

        clear(...args: any): Model;

        table: string;
        // id: string[];
        id: string;

        /* fix or patch :start */
        allProperties: { [key: string]: OrigDetailedModelProperty }

        /**
         * methods used to add associations
         */
        // hasOne: (...args: any[]) => any;
        hasOne: {
            (assoc_name: string, ext_model: Model, assoc_options?: AssociationDefinitionOptions_HasOne): FibOrmFixedExtendModel
            (assoc_name: string, assoc_options?: AssociationDefinitionOptions_HasOne): FibOrmFixedExtendModel
        }
        hasMany: {
            (assoc_name: string, ext_model: Model, assoc_options?: AssociationDefinitionOptions_HasMany): FibOrmFixedExtendModel
            (assoc_name: string, ext_model: Model, assoc_props?: ModelPropertyDefinitionHash, assoc_options?: AssociationDefinitionOptions_HasMany): FibOrmFixedExtendModel
        }
        extendsTo: (...args: any[]) => Model;

        extends: { [extendModel: string]: ExtendModelWrapper };
        /* fix or patch :end */

        [property: string]: any;
    }
    // just for compatible
    type FibOrmFixedModel = Model

    export interface Instance {
        on(event: string, callback): Instance;
        save(): Instance;
        save(data: { [property: string]: any; }, callback: (err: Error) => void): Instance;
        save(data: { [property: string]: any; }, options: any, callback: (err: Error) => void): Instance;
        saved(): boolean;
        remove(callback: (err: Error) => void): Instance;
        isInstance(): boolean;
        isPersisted(): boolean;
        isShell(): boolean;
        validate(callback: (errors: Error[]) => void);
        /* all fixed: start */
        on(event: string, callback): Instance;
        save(callback?: ORMMethod__CommonCallback): Instance;
        save(data: { [property: string]: any; }, callback?: ORMMethod__CommonCallback): Instance;
        save(data: { [property: string]: any; }, options: any, callback?: ORMMethod__CommonCallback): Instance;
        saved(): boolean;
        remove(callback?: ORMMethod__CommonCallback): Instance;

        /**
         * @noenum
         */
        isInstance(): boolean;
        /**
         * @noenum
         */
        isPersisted(): boolean;
        /**
         * @noenum
         */
        isShell(): boolean;
        validate(callback: (errors: Error[]) => void);
        /* all fixed: end */

        /* missing fix: start */
        /**
         * @noenum
         */
        set: Function;
        markAsDirty: (propName?) => void;
        dirtyProperties: {[key: string]: any};

        /**
         * @noenum
         */
        __singleton_uid(): string | number;

        /**
         * @noenum
         */
        __opts?: InstanceOptions;

        /**
         * @noenum
         */
        // model: Model;
        model(): Model;

        /* missing fix: end */

        [extraProperty: string]: any;
    }
    // patch the missing field defined in orm/lib/Instance.js (such as defined by Object.defineProperty)
    type FibOrmFixedModelInstance = Instance 

    export interface ModelOptions {
        id?: string[];
        autoFetch?: boolean;
        autoFetchLimit?: number;
        cacheFetch?: boolean;
        hooks?: Hooks;
        methods?: { [name: string]: Function };

        [extensibleProperty: string]: any;
    }
    // just for compatible
    type FibOrmFixedModelOptions = ModelOptions

    export interface Hooks {
        beforeValidation?: (next?) => void;
        beforeCreate?: (next?) => void;
        afterCreate?: (next?) => void;
        beforeSave?: (next?) => void;
        afterSave?: (success?: boolean) => void;
        afterLoad?: (success?: boolean) => void;
        afterAutoFetch?: (next?) => void;
        beforeRemove?: (next?) => void;
        afterRemove?: (success?: boolean) => void;
    }

    export interface HasManyHooks {
        beforeSave?: {
            (next?: Function): void;
            (extra, next: Function): void;
        }
    }

    export interface IConnectionOptions {
        protocol: string;
        host?: string;
        port?: number;
        auth?: string;
        username?: string;
        password?: string;
        database?: string;
        pool?: boolean;
        debug?: boolean;
    }

    export interface IAggregated {
        groupBy(...columns: string[]): IAggregated;
        limit(limit: number): IAggregated;
        limit(offset: number, limit: number): IAggregated;
        order(...order: string[]): IAggregated;
        select(columns: string[]): IAggregated;
        select(...columns: string[]): IAggregated;
        as(alias: string): IAggregated;
        call(fun: string, args: any[]): IAggregated;
        get(callback: (err: Error, instance: Instance) => void);
    }

    export interface IChainFind {
        find(conditions: ModelMethod__FindConditions): IChainFind;

        only(...args: string[]): IChainFind;
        limit(limit: number): IChainFind;
        offset(offset: number): IChainFind;
        run(callback?: ModelMethod__CommonCallback): void;
        count(callback: ModelMethod__CountCallback): void;
        remove(callback: (err: Error) => void): void;
        save(callback: (err: Error) => void): void;
        each(callback: (result: Instance) => void): void;
        each(): IChainFind;
        filter(callback: (result: Instance) => boolean): IChainFind;
        sort(callback: (a: Instance, b: Instance) => boolean): IChainFind;
        get(callback: (results: Instance[]) => void): IChainFind;

    }

    export interface IChainFindInstance {
        all(conditions: ModelMethod__FindConditions): IChainFindInstance;
        where(conditions: ModelMethod__FindConditions): IChainFindInstance;
        find(conditions: ModelMethod__FindConditions): IChainFindInstance;
        
        only(...args: string[]): IChainFindInstance;
        omit(): IChainFindInstance;
        skip(offset: number): IChainFindInstance;
        offset(offset: number): IChainFindInstance;

        order(propertyOrderDesc: string, order?: string | "Z" | "A"): IChainFindInstance;
        orderRaw(str: string, args: any[]): IChainFindInstance;
        limit(limit: number): IChainFindInstance;
        count(callback: ModelMethod__CountCallback): void;
        remove(callback: (err: Error) => void): void;
        run(callback?: ModelMethod__CommonCallback): void;

        // removed in commit 717ee65a7a23ed6762856cf3c187700e36c9ba70
        // success(callback?: ModelMethod__CommonCallback): void;
        // fail(callback?: ModelMethod__CommonCallback): void;

        first(callback?: ModelMethod__CommonCallback): void;
        last(callback?: ModelMethod__CommonCallback): void;

        each(callback: (result: Instance) => void): void;
        each(): IChainFindInstance;

        eager(): IChainFindInstance;

        model: Model;
        options: ChainFindInstanceOptions

        [extraProperty: string]: any;
    }

    export interface ChainFindOptions {
        conditions
        properties
        order
        driver
        only
        table
        limit
        merge
        offset
        keys
        newInstance: {
            (data: InstanceDataPayload, cb: Function): void
        }
        keyProperties
        associations

        /* in instance */
        exists?
        __eager?
    }

    export interface ChainFindInstanceOptions extends ChainFindOptions {
    }

    interface Plugin {
        (connection: FibORM, proto: any, opts: any, cb: Function): any
    }

    /*
     * Classes
    */

    export class ORM extends Class_EventEmitter {
        validators: FxOrmValidators.ValidatorModules;
        enforce: FxOrmValidators.FibjsEnforce;
        settings: SettingInstance;
        driver_name: string;
        driver: any;
        tools: any;
        models: { [key: string]: Model };
        plugins: Plugin[];

        use(plugin: string, options?: any): ORM;
        use(plugin: Plugin, options?: any): ORM;

        define(name: string, properties: ModelPropertyDefinitionHash, opts?: ModelOptions): Model;
        ping(callback: (err: Error) => void): ORM;
        close(callback: (err: Error) => void): ORM;
        load(file: string, callback: (err: Error) => void): any;
        sync(callback: (err: Error) => void): ORM;
        drop(callback: (err: Error) => void): ORM;
    }

    export interface SingletonOptions {
        identityCache?: any;
        saveCheck?: boolean;
    }

    export class singleton {
        static clear(key?: string): singleton;
        static get(key, opts: SingletonOptions, createCb: Function, returnCb: Function);
    }

    interface SettingsContainerGenerator {
        (options: object): SettingInstance
    }

    interface SettingInstance {
        set(key, value): SettingInstance
        get(key: string, def?: Function): any
        unset(): SettingInstance
    }

    export class Settings {
        constructor(settings: any);
        
        static Container: any;

        static defaults(): {
            properties: {
                primary_key: string;
                association_key: string;
                required: boolean;
            };

            instance: {
                identityCache: boolean;
                identityCacheSaveCheck: boolean;
                autoSave: boolean;
                autoFetch: boolean;
                autoFetchLimit: number;
                cascadeRemove: boolean;
                returnAllErrors: boolean;
            };

            connection: {
                reconnect: boolean;
                poll: boolean;
                debug: boolean;
            };
        };
    }

    export var settings: SettingInstance;

    export class PropertyModule {
        static normalize(property: string, settings: SettingInstance): any;
        static validate(value: any, property: string): any;
    }

    interface ConnectFunction {
        (uri: string): FxOrmNS.ORM;
        (uri: string, callback: (err: Error, db: FxOrmNS.ORM) => void): FxOrmNS.ORM;
        (options: FxOrmNS.IConnectionOptions): FxOrmNS.ORM;
        (options: FxOrmNS.IConnectionOptions, callback: (err: Error, db: FxOrmNS.ORM) => void): FxOrmNS.ORM;
    }

    interface ExportModule extends 
        /* deprecated :start */
        // just use require('@fxjs/sql-query').comparators.xxx plz
        FxSqlQuery.ComparatorHash
        /* deprecated :end */
    {
        validators: FxOrmValidators.ValidatorModules
        Settings: Settings
        settings: SettingInstance
        singleton: any
        Property: PropertyModule
        enforce: FxOrmValidators.FibjsEnforce
        ErrorCodes: FxOrmNS.PredefineErrorCodes
        addAdapter: FxOrmNS.AddAdapatorFunction

        /* deprecated :start */
        Text: FxSqlQuery.TypedQueryObjectWrapper<'text'>;
        /* deprecated :end */

        use(connection: Class_DbConnection, protocol: string, options: IConnectionOptions, callback: (err: Error, db?: FxOrmNS.ORM) => void): any;
        connect: ConnectFunction;
        connectSync(opts: FibORMIConnectionOptions | string): FibORM;

        [extra: string]: any
    }
}
import FibOrmNS = FxOrmNS

declare module "@fxjs/orm" {
    const mod: FxOrmNS.ExportModule
    export = mod
}

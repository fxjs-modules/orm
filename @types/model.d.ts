/// <reference types="@fxjs/sql-query" />
/// <reference path="_common.d.ts" />
/// <reference path="Validators.d.ts" />
/// <reference path="instance.d.ts" />
/// <reference path="settings.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="Queries.d.ts" />

declare namespace FxOrmModel {
    interface Class_ModelDefinitionOptions {
        collection?: Class_ModelConstructOptions['collection']
        indexes?: Class_ModelConstructOptions['indexes']
        keys?: Class_ModelConstructOptions['keys']

        autoSave?: boolean
        autoFetch?: boolean
        cascadeRemove?: boolean
    }

    type Class_ModelConstructOptions = FxOrmTypeHelpers.ConstructorParams<typeof FxOrmModel.Class_Model>[0]
    type ModelProperty = FxOrmProperty.Class_Property<Class_Model['propertyContext']>

    class Class_Model extends FxOrmQueries.Class_QueryBuilder {
        name: string
        collection: string

        readonly orm: FxOrmNS.Class_ORM

        properties: {[k: string]: ModelProperty}
        readonly propertyNames: string[]
        readonly propertyList: ModelProperty[]

        readonly associationNames: string[]
        associations: {[k: string]: FxOrmModel.Class_MergeModel}

        settings: any

        readonly storeType: ModelProperty['$storeType']
        readonly isMergeModel: boolean

        /* meta :start */
        /**
         * @description if this model has no key
         * @default false
         */
        readonly noKey: boolean
        /* meta :end */

        /**
         * @description id property name
         */
        readonly id: string
        /**
         * @description all id-type field property names
         */
        readonly ids: string[]
        /**
         * @description all id-type field properties
         */
        readonly idPropertyList: ModelProperty[]

        readonly keyPropertyNames: string[]
        readonly keyPropertyList: ModelProperty[]
        readonly keys: string[]

        readonly _symbol: Symbol
        readonly $dml: FxOrmDML.DMLDriver
        readonly $ddl: FxOrmDDL.DDLDriver
        readonly schemaBuilder: FXJSKnex.FXJSKnexModule.KnexInstance['schema']
        readonly queryBuilder: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>

        readonly propertyContext: {
            model: FxOrmModel.Class_Model,
            knex: FxOrmDXL.DXLDriver<any>['sqlQuery']['knex']
        }

        constructor (config: {
            name: string
            orm: FxOrmNS.Class_ORM
            settings: any
            collection: string
            properties: FxOrmProperty.NormalizedPropertyHash

            indexes?: string[]
            /**
             * @description above priorities of properties' specification
             *
             * if keys === false, all properties are not key
             */
            keys?: string[] | false

            autoSave?: boolean
            autoFetch?: boolean
            cascadeRemove?: boolean
            methods?: {[method_name: string]: Function}
            validations?: FxOrmValidators.IValidatorHash
        })

        isPropertyName (name: string): boolean
        isAssociationName (name: string): boolean

        /**
         * @description create one instance from data input
         *
         * if input is just one instance, New() would create the new one rather than use old one
         *
         * @param input dataset for create one instance
         */
        New: FxOrmTypeHelpers.ReturnItemOrArrayAccordingTo_1stParam<Fibjs.AnyObject | string | number, FxOrmInstance.Class_Instance>
        /* ddl about :start */

        /**
         * @description sync collection definition to remote endpoint
         */
        sync (): void

        /**
         * @description drop collection from remote endpoint
         */
        drop (): void

        /**
         * @description is property existed in remote endpoint
         * @warn only valid in sql-type dbdriver
         */
        hasPropertyRemotely (property: string | ModelProperty): boolean
        /* ddl about :end */

        /* dml about :end */
        /**
         * @description create one instance from this model
         */
        create: {
            (kvItem: Fibjs.AnyObject): FxOrmInstance.Class_Instance
            (kvItem: Fibjs.AnyObject[]): FxOrmInstance.Class_Instance[]
        }
        /**
         * @description remove items corresponding to conditions
         *
         * @param opts.where
         *
         * @return remove count
         */
        remove (
            opts?: {
                where: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['where']
            }
        ): number
        /**
         * @description clear all data in remote endpoints
         */
        clear (): void
        /* dml about :end */

        /* utils :start */
        /**
         * @description
         *  filter out properties-about key-value in dataset only,
         *  and transform [key] to correspoding `mapsTo` field in property
         */
        normalizeDataToProperties (dataset: Fibjs.AnyObject, target?: Fibjs.AnyObject): any
        /**
         * @description
         *  filter out properties-about key-value in datastore only,
         *  and transform [key] to correspoding `name` field in property
         */
        normalizePropertiesToData (datastore: Fibjs.AnyObject, target?: Fibjs.AnyObject): any
        /**
         * @description
         *  filter out properties-about key-value in `mixed` only,
         *  and transform [key] to correspoding `name` field in property
         */
        normlizePropertyData (mixed: Fibjs.AnyObject, target?: Fibjs.AnyObject): any
        /**
         * @description
         *  filter out association-about key-value in `mixed` only,
         *  and transform [key] to correspoding `name` field in property
         */
        normlizeAssociationData (mixed: Fibjs.AnyObject, target?: Fibjs.AnyObject): any
        /**
         * @description
         *  filter out association-about key-value in dataset only,
         *  if no key-value about association, would return one empty array
         *
         * @return []
         */
        filterOutAssociatedData (dataset: Fibjs.AnyObject): {
            association: FxOrmModel.Class_Model['associations'][any],
            dataset: any,
        }[]
        addProperty(
            name: string,
            propertyDefinition: ModelProperty | FxOrmProperty.NormalizedProperty
        ): ModelProperty

        fieldInfo(propertyName: string): {
            type: 'self'
            property: Class_Model['properties'][any]
        } | {
            type: 'association'
            association: Class_Model['associations'][any]
        } | null
        /* utils :end */

        hasOne(
            model: FxOrmModel.Class_Model,
            opts?: {
                as?: string,
                associationKey?: string | ((ctx: any) => string)
            }
        ): Class_MergeModel

        hasMany(
            model: FxOrmModel.Class_Model,
            opts?: {
                as: string
                collection: string
                type: 'm2m' | 'o2m'
                matchKeys?: Class_MergeModel['associationInfo']['matchKeys']
            }
        ): Class_MergeModel

        belongsToMany(
            model: Class_Model,
            opts?: {
                as?: string
                collection: string
                matchKeys?: Class_MergeModel['associationInfo']['matchKeys']
            }
        ): Class_MergeModel

        defineMergeModel (
            opts: {
                source: {
                    model: Class_Model,
                    foreignKey: string | string[]
                },
                target: {
                    model: Class_Model
                    foreignKey: string | string[]
                },
                onFind: (
                    ctx: {
                        sourceModel: Class_Model,
                        sourceModelKeys: string[],
                        targetModel: Class_Model,
                        targetModelKeys: string[],
                        mergeModel: Class_MergeModel,
                    }
                ) => FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['find']>,
                onSourceInstanceSave: ({
                    sourceModel: Class_Model,
                    sourceModelKeys: string[],
                    sourceInstance: FxOrmInstance.Class_Instance,

                    targetModel: Class_Model,
                    targetModelKeys: string[],
                    targetInstance: FxOrmInstance.Class_Instance,

                    mergeModel: Class_MergeModel,
                }),
            }
        ): Class_MergeModel
    }
    /**
     * @description generated on building association
     */
    class Class_MergeModel extends Class_Model {
        /**
         * @description association name
         */
        name: string
        /**
         * @description association type
         */
        type: 'o2o' | 'o2m' | 'm2o' | 'm2m'
        /**
         * @description name of collection which used as association table/collection in remote endpoints
         */
        sourceModel: FxOrmModel.Class_Model
        readonly sourceKeys: string[]
        sourceJoinKey: string

        targetModel: FxOrmModel.Class_Model
        readonly targetKeys: string[]
        targetJoinKey: string

        /**
         * @description this is fully determined by `options.matchKeys` in constructor
         */
        readonly associationKeys: string[]

        /**
         * @description
         *  association information, used to generate matching
         *  where query-conditions
         */
        associationInfo: {
            collection: string
            matchKeys: {
                source: string,
                target: string,
                comparator: string
            }
        }

        constructor (opts: FxOrmModel.Class_ModelConstructOptions & {
            mergeCollection: string
            type: Class_MergeModel['type']

            source: Class_MergeModel['sourceModel']
            sourceJoinKey?: Class_MergeModel['sourceJoinKey']
            target: Class_MergeModel['targetModel']
            targetJoinKey?: Class_MergeModel['targetJoinKey']

            matchKeys: Class_MergeModel['associationInfo']['matchKeys']
        })

        isSourceModel (model: Class_Model): boolean
        isTarget (model: Class_Model): boolean

        saveForSource (opts: {
            targetDataSet: Fibjs.AnyObject | FxOrmInstance.Class_Instance,
            sourceInstance: FxOrmInstance.Class_Instance
        }): void

        findForSource (opts: {
            sourceInstance: FxOrmInstance.Class_Instance
        }): FxOrmTypeHelpers.ItOrListOfIt<FxOrmInstance.Class_Instance>

        removeForSource (opts: {
            sourceInstance: FxOrmInstance.Class_Instance
        }): void

        // this.$refs[refName].remove()

        // joinFind (): any
    }
    // next generation model :end
}

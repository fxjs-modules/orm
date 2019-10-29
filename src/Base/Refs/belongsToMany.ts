import { arraify } from "../../Utils/array";
import { snowflake } from "../../Utils/uuid";

export = function defineRef (
    this: FxOrmModel.Class_Model,
    ...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['belongsToMany']>
) {
    const [ tM = this, opts ] = args;

    const {
        as: asKey = `${this.collection}s`,
        collection = `${tM.collection}_${this.collection}s`,
        sourceJoinKey = this.id,
        targetJoinKey = tM.id
    } = opts || {}

    if (tM.fieldInfo(asKey))
        throw new Error(`[MergeModel::belongsToMany] target model(collection: ${tM.collection}) already has field "${asKey}", it's not allowed to add one associated field to it.`)

    const iterateJoinKeysInMergeCollection = function (opts: {
        onSourceRefProperty: (property: FxOrmProperty.Class_Property) => any,
        onTargetRefProperty: (property: FxOrmProperty.Class_Property) => any
    }) {
        mergeModel.joinPropertyList.forEach(property => {
            if (property.joinNode.refCollection === mergeModel.sourceModel.collection) {
                opts.onSourceRefProperty(property)
            }
            if (property.joinNode.refCollection === mergeModel.targetModel.collection) {
                opts.onTargetRefProperty(property)
            }
        })
    }

    const mergeModel: FxOrmModel.Class_MergeModel = tM.defineAssociation({
        name: asKey,
        collection: collection,
        properties: {},
        type: 'm2m',
        target: this,
        defineMergeProperties: ({ mergeModel }) => {
            const { targetModel, sourceModel } = mergeModel

            if (!sourceJoinKey)
                if (sourceModel.ids.length > 1)
                    throw new Error(
                        `[MergeModel::constructor/belongsToMany] source model(collection: ${sourceModel.collection})`
                        + `has more than one id properties, you must specify sourceJoinKey`,
                    )
                else if (!sourceModel.ids.length)
                    throw new Error(
                        `[MergeModel::constructor/belongsToMany] source model(collection: ${sourceModel.collection})`
                        + `has no any id property, you must specify sourceJoinKey`,
                    )
                else if (!sourceModel.isPropertyName(sourceJoinKey))
                    throw new Error(
                        `[MergeModel::constructor/belongsToMany] source model(collection: ${sourceModel.collection}) has no property(name: ${sourceJoinKey})`
                    )

            const sProperty = sourceModel.properties[sourceJoinKey]
            const sname = `${sourceModel.collection}_id`

            mergeModel.addProperty(
                sname,
                sProperty
                    .renameTo({ name: sname })
                    .useAsJoinColumn({ column: sProperty.name, collection: sourceModel.collection })
                    .deKeys()
            )

            if (!targetJoinKey)
                if (targetModel.ids.length > 1)
                    throw new Error(
                        `[MergeModel::constructor/belongsToMany] target model(collection: ${targetModel.collection})`
                        + `has more than one id properties, you must specify targetJoinKey`,
                    )
                else if (!targetModel.ids.length)
                    throw new Error(
                        `[MergeModel::constructor/belongsToMany] target model(collection: ${sourceModel.collection})`
                        + `has no any id property, you must specify targetJoinKey`,
                    )
                else if (!targetModel.isPropertyName(targetJoinKey))
                    throw new Error(
                        `[MergeModel::constructor/belongsToMany] target model(collection: ${sourceModel.collection}) has no property(name: ${targetJoinKey})`
                    )

            const tProperty = targetModel.properties[targetJoinKey]
            const tname = `${targetModel.collection}_id`

            mergeModel.addProperty(
                tname,
                tProperty
                    .renameTo({ name: tname })
                    .useAsJoinColumn({ column: tProperty.name, collection: targetModel.collection })
                    .deKeys()
            )
        },
        howToGetIdPropertyNames: ({ mergeModel }) => {
            return mergeModel.joinKeys
        },
        howToCheckExistenceForSource: ({ mergeModel, mergeInstance }) => {
        },
        howToCheckHasForSource: ({ mergeModel, sourceInstance, targetInstances }) => {
            const { targetModel, sourceModel } = mergeModel

            const zeroChecking = {
                is: !targetInstances || (Array.isArray(targetInstances) && !targetInstances.length),
                existed: false
            }

            const results = <{[k: string]: boolean}>{};
            const targetIds = (targetInstances || []).map(x => {
                results[x[targetModel.id]] = false;
                return x[targetModel.id];
            })

            const ss = <any>{};
            const sourceons = <any>{};
            const targetons = <any>{};

            let targetRef: string;
            const wheres = <any>{};

            iterateJoinKeysInMergeCollection({
                onSourceRefProperty: (property) => {
                    ss[property.mapsTo] = property.mapsTo
                    wheres[property.mapsTo] = sourceInstance[sourceModel.id]
                    sourceons[property.mapsTo] = sourceModel.refTableCol({
                        table: property.joinNode.refCollection,
                        column: property.joinNode.refColumn
                    })
                },
                onTargetRefProperty: (property) => {
                    ss[property.mapsTo] = property.mapsTo
                    if (targetIds.length) wheres[property.mapsTo] = targetModel.Opf.in(targetIds)

                    targetons[property.mapsTo] = targetModel.refTableCol({
                        table: property.joinNode.refCollection,
                        column: property.joinNode.refColumn
                    })
                    targetRef = property.mapsTo
                }
            })

            ;<FxOrmInstance.Class_Instance[]>(mergeModel.find({
                select: ss,
                joins: [
                    mergeModel.leftJoin({
                        collection: sourceModel.collection,
                        on: sourceons
                    }),
                    mergeModel.leftJoin({
                        collection: targetModel.collection,
                        on: targetons
                    })
                ],
                where: wheres,
                filterQueryResult (_results) {
                    if (zeroChecking.is) {
                        zeroChecking.existed = !!_results.length && _results.some((x: any) => x && !!x[targetRef])
                    } else {
                        _results.forEach(({[targetRef]: targetRefId}: any) => {
                            if (targetRefId && results.hasOwnProperty(targetRefId))
                                results[targetRefId] = true
                        })
                    }

                    return _results
                }
            }))

            if (zeroChecking.is) return { final: zeroChecking.existed, ids: {} }

            return {
                final: targetIds.every(id => !!results[id]),
                ids: results
            }
        },
        howToFetchForSource: ({ mergeModel, sourceInstance, findOptions }) => {
            const { targetModel, sourceModel } = mergeModel
            if (!findOptions) findOptions = {}

            const ss = <any>{};
            const sourceons = <any>{};
            const targetons = <any>{};

            const uuid = snowflake()
            const sprefix = `s${uuid}_`
            const tprefix = `t${uuid}_`

            iterateJoinKeysInMergeCollection({
                onSourceRefProperty: (property) => {
                    ss[property.mapsTo] = property.mapsTo
                    sourceModel.propertyList.forEach(sproperty => {
                        ss[`${sprefix}${sproperty.name}`] = sourceModel.propIdentifier(sproperty.mapsTo)
                    })
                    sourceons[mergeModel.propIdentifier(property.mapsTo)] = sourceModel.refTableCol({
                        table: property.joinNode.refCollection,
                        column: property.joinNode.refColumn
                    })
                },
                onTargetRefProperty: (property) => {
                    ss[property.mapsTo] = property.mapsTo
                    targetModel.propertyList.forEach(tproperty => {
                        ss[`${tprefix}${tproperty.name}`] = targetModel.propIdentifier(tproperty.mapsTo)
                    })

                    targetons[mergeModel.propIdentifier(property.mapsTo)] = targetModel.refTableCol({
                        table: property.joinNode.refCollection,
                        column: property.joinNode.refColumn
                    })
                }
            })

            sourceInstance[mergeModel.name] = sourceModel.find({
                ...findOptions,
                select: ss,
                joins: [
                    sourceModel.leftJoin({
                        collection: mergeModel.collection,
                        on: sourceons
                    }),
                    targetModel.leftJoin({
                        collection: targetModel.collection,
                        on: targetons
                    })
                ],
                filterQueryResult (_results) {
                    let targetKv = <any>{}
                    const tlen = tprefix.length
                    let sourceKv = <any>{}
                    const slen = sprefix.length

                    return _results.map((item: any) => {
                        targetKv = {}
                        sourceKv = {}
                        Object.keys(item).forEach(itemk => {
                            if (itemk.startsWith(tprefix)) {
                                targetKv[itemk.slice(tlen)] = item[itemk]
                            } else if (itemk.startsWith(sprefix)) {
                                sourceKv[itemk.slice(slen)] = item[itemk]
                            }
                        })
                        return targetKv
                    })
                }
            })
        },
        howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance, isAddOnly }) => {
            let inputs = <FxOrmInstance.Class_Instance[]>[]
            inputs = arraify(mergeModel.targetModel.New(targetDataSet));

            // don't change it it no inputs
            if (inputs && inputs.length)
                sourceInstance[mergeModel.name] = sourceInstance[mergeModel.name] || []

            const targetResults = inputs.map((targetInst: FxOrmInstance.Class_Instance) => {
                targetInst.$save()

                const kv = <Fibjs.AnyObject>{};
                mergeModel.joinPropertyList.forEach(property => {
                    // TODO: use property's required constrain to check them
                    if (property.joinNode.refCollection === sourceInstance.$model.collection)
                        kv[property.name] = sourceInstance[property.joinNode.refColumn]

                    if (property.joinNode.refCollection === targetInst.$model.collection)
                        kv[property.name] = targetInst[property.joinNode.refColumn]
                })

                const mergeInstance = mergeModel.New(kv)
                if (!mergeInstance.$exists()) mergeInstance.$save()

                return targetInst.toJSON()
            })

            sourceInstance[mergeModel.name] = mergeModel.targetModel.New(targetResults)
        },
        howToUnlinkForSource: ({ mergeModel, targetInstances, sourceInstance }) => {
            const { targetModel, sourceModel } = mergeModel

            const removeAll = !targetInstances.length

            const removeWheres = <any>{};
            let targetRefKey: string
            iterateJoinKeysInMergeCollection({
                onSourceRefProperty: (property) => {
                    removeWheres[property.name] = sourceInstance[sourceModel.id]
                },
                onTargetRefProperty: (property) => {
                    if (!targetRefKey) targetRefKey = property.name
                    if (!removeAll)
                        removeWheres[targetRefKey] = targetModel.Opf.in(targetInstances.map(inst => inst[targetModel.id]))
                }
            })

            mergeModel.remove({ where: removeWheres })

            if (removeAll) sourceInstance[mergeModel.name] = null
        },
        onFindByRef: ({ mergeModel, complexWhere, mergeModelFindOptions: findOptions }) => {
        },
    })

    return mergeModel
}
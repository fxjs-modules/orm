import { arraify, isEmptyArray, deduplication } from "../../Utils/array";

export = function defineRef (
    this: FxOrmModel.Class_Model,
    ...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasManyExclusively']>
) {
    const [ targetModel, opts ] = args;

    const {
        as: asKey = `${targetModel.collection}s`,
        reverseAs = `of_${asKey}`,
    } = opts

    if (!asKey) throw new Error(`[hasManyExclusively] "as" is required for association name`)

    const mergePropertyNameInTarget = `${reverseAs}_id`

    const mergeModel = this.defineAssociation({
        name: asKey,
        collection: targetModel.collection,
        /**
         * @important pass {keys: false} to disable auto-fill id key
         */
        // keys: false,
        properties: {},
        type: 'o2m',
        target: targetModel,
        defineMergeProperties: ({ mergeModel }) => {
            const { targetModel, sourceModel } = mergeModel

            if (targetModel.fieldInfo(mergePropertyNameInTarget))
                return ;

            const sProperty = sourceModel.prop(sourceModel.id)

            mergeModel.addProperty(
                mergePropertyNameInTarget,
                sProperty
                    .renameTo({ name: mergePropertyNameInTarget })
                    .useAsJoinColumn({ column: sProperty.name, collection: sourceModel.collection })
                    .deKeys()
            )

            targetModel.propertyList.forEach(tProperty => {
                if (mergeModel.fieldInfo(tProperty.name)) return ;

                mergeModel.addProperty(
                    tProperty.name,
                    tProperty
                        .renameTo({ name: tProperty.name })
                        .deKeys()
                )
            })
        },
        howToGetIdPropertyNames: ({ mergeModel }) => {
            return [mergeModel.sourceModel.id]
        },
        howToCheckExistenceForSource: ({ mergeModel, mergeInstance }) => {
            return mergeModel.targetModel.idPropertyList.every(prop => mergeInstance.$isFieldFilled(prop.name))
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
            const alias = `${targetModel.collection}_${targetModel.id}`

            ;<FxOrmInstance.Class_Instance[]>(mergeModel.find({
                select: (() => {
                    const ss = { [mergePropertyNameInTarget]: mergeModel.propIdentifier(mergePropertyNameInTarget) };
                    /**
                     * @todo reduce unnecesary property
                     */
                    ss[alias] = targetModel.propIdentifier(targetModel.id)

                    return ss
                })(),
                where: {
                    /**
                     * @todo support where default and
                     */
                    [targetModel.Op.and]: {
                        [mergePropertyNameInTarget]: sourceInstance[mergeModel.sourceModel.id],
                        ...targetIds.length && { [alias]: targetModel.Opf.in(targetIds) }
                    }
                },
                joins: [
                    mergeModel.leftJoin({
                        collection: sourceModel.collection,
                        on: {
                            [mergePropertyNameInTarget]: mergeModel.refTableCol({
                                table: sourceModel.collection,
                                column: sourceModel.id
                            }),
                        }
                    })
                ],
                filterQueryResult (_results) {
                    if (zeroChecking.is) {
                        zeroChecking.existed = !!_results.length && _results.some((x: any) => x && !!x[alias])
                    } else {
                        _results.forEach(({[alias]: alias_id}: any) => {
                            if (alias_id && results.hasOwnProperty(alias_id)) results[alias_id] = true
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

            /**
             * @shouldit concat and dupcate it?
             */
            sourceInstance[mergeModel.name] = <FxOrmInstance.Class_Instance[]>(mergeModel.find({
                ...findOptions,
                select: (() => {
                    const ss = { [mergePropertyNameInTarget]: mergeModel.propIdentifier(mergePropertyNameInTarget) };
                    targetModel.propertyList.forEach(property => {
                        ss[property.mapsTo] = targetModel.propIdentifier(property)
                    })
                    return ss
                })(),
                where: {
                    [mergePropertyNameInTarget]: sourceInstance[mergeModel.sourceModel.id]
                },
                joins: [
                    mergeModel.leftJoin({
                        collection: sourceModel.collection,
                        on: {
                            [mergeModel.Op.and]: [
                                {
                                    [mergePropertyNameInTarget]: mergeModel.refTableCol({
                                        table: sourceModel.collection,
                                        column: sourceModel.id
                                    }),
                                }
                            ]
                        }
                    })
                ],
            })).map(x => x.$set(reverseAs, sourceInstance))
        },
        howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance, isAddOnly }) => {
            if (isEmptyArray(targetDataSet)) sourceInstance.$unlinkRef(mergeModel.name)

            const mergeInsts = arraify(mergeModel.New(targetDataSet));
            if (mergeInsts && mergeInsts.length)
                sourceInstance[mergeModel.name] = sourceInstance[mergeModel.name] || []

            const mergeDataList = mergeInsts.map((mergeInst: FxOrmInstance.Class_Instance) => {
                if (!sourceInstance[mergeModel.sourceModel.id]) return ;
                mergeInst[mergePropertyNameInTarget] = sourceInstance[mergeModel.sourceModel.id]

                mergeInst.$save()

                return mergeInst.toJSON()
            })

            if (!isAddOnly && Array.isArray(sourceInstance[mergeModel.name]))
                sourceInstance[mergeModel.name].splice(0)

            sourceInstance[mergeModel.name] =
                deduplication(
                    <FxOrmInstance.Class_Instance[]>(sourceInstance[mergeModel.name] || [])
                        .concat(mergeDataList),
                    (item) => item[targetModel.id]
                )
                .map((x: Fibjs.AnyObject) => mergeModel.New(x).$set(reverseAs, sourceInstance))

        },
        howToUnlinkForSource: ({ mergeModel, targetInstances, sourceInstance }) => {
            const { targetModel } = mergeModel

            const targetIds = <string[]>[];
            targetInstances.forEach(x => {
                if (x.$isFieldFilled(targetModel.id)) targetIds.push(x[targetModel.id])
            })

            mergeModel.$dml.update(
                mergeModel.collection,
                {
                    [mergePropertyNameInTarget]: null
                },
                {
                    connection: this.orm.connection,
                    where: {
                        [mergePropertyNameInTarget]: sourceInstance[mergeModel.sourceModel.id],
                        ...targetIds.length && { [targetModel.id]: targetModel.Opf.in(targetIds) }
                    }
                }
            )

            targetInstances.forEach(x => x.$set(reverseAs, null))
        },
        onFindByRef: ({ mergeModel, complexWhere, mergeModelFindOptions: findOptions }) => {
            const { sourceModel } = mergeModel
            findOptions = {...findOptions}

            return sourceModel.find({
                ...findOptions,
                select: (() => {
                    // const ss = { [mergePropertyNameInTarget]: mergeModel.propIdentifier(mergePropertyNameInTarget) };
                    const ss = <Record<string, string>>{};
                    sourceModel.propertyList.forEach(property =>
                        ss[property.mapsTo] = sourceModel.propIdentifier(property)
                    )
                    return ss
                })(),
                where: complexWhere,
                joins: [
                    <any>sourceModel.leftJoin({
                        collection: mergeModel.collection,
                        on: {
                            [sourceModel.Op.and]: [
                                {
                                    [sourceModel.id]: mergeModel.refTableCol({
                                        table: mergeModel.collection,
                                        column: mergePropertyNameInTarget
                                    }),
                                },
                            ]
                        }
                    })
                ].concat(findOptions.joins ? arraify(findOptions.joins) : [])
            })
        },
    })

    return mergeModel
}
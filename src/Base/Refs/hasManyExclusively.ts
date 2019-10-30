import { arraify, isEmptyArray, deduplication } from "../../Utils/array";

export = function defineRef (
    this: FxOrmModel.Class_Model,
    ...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasManyExclusively']>
) {
    const [ targetModel, opts ] = args;

    const {
        as: asKey = `${targetModel.collection}s`,
        reverseAs: sourceAsKey = `of_${asKey}`,
    } = opts

    if (!asKey) throw new Error(`[hasManyExclusively] "as" is required for association name`)

    const joinNodeSource = `${sourceAsKey}_id`
    const joinNodeTarget = targetModel.id

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
        howToCheckExistenceWhenNoKeys: ({ instance }) => {
            if (!instance.$isFieldFilled(joinNodeTarget) || !instance[joinNodeTarget]) return false
            // if (!instance.$isFieldFilled(joinNodeSource) || !instance[joinNodeSource]) return false

            return !!mergeModel.count({
                where: {
                    // [joinNodeSource]: instance[joinNodeSource],
                    [joinNodeTarget]: instance[joinNodeTarget],
                }
            })
        },
        defineMergeProperties: ({ mergeModel }) => {
            const { targetModel, sourceModel } = mergeModel

            if (targetModel.fieldInfo(joinNodeSource)) return ;

            const sProperty = sourceModel.prop(sourceModel.id)

            mergeModel.addProperty(
                joinNodeSource,
                sProperty
                    .renameTo({ name: joinNodeSource })
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
            // return targetModel.ids.concat(joinNodeSource)
            return targetModel.ids
        },
        howToCheckHasForSource: ({ mergeModel, sourceInstance, targetInstances }) => {
            const { targetModel, sourceModel } = mergeModel

            const zeroChecking = {
                is: !targetInstances || (Array.isArray(targetInstances) && !targetInstances.length),
                existed: false
            }

            const results = <{[k: string]: boolean}>{};
            const targetIds = (targetInstances || []).map(x => {
                results[x[joinNodeTarget]] = false;
                return x[joinNodeTarget];
            })
            const joinPropertyInTarget = targetModel.propIdentifier(joinNodeTarget)

            ;<FxOrmInstance.Class_Instance[]>(mergeModel.find({
                select: (() => {
                    const ss = { [joinNodeSource]: mergeModel.propIdentifier(joinNodeSource) };
                    /**
                     * @todo reduce unnecesary property
                     */
                    ss[joinPropertyInTarget] = targetModel.propIdentifier(joinNodeTarget)

                    return ss
                })(),
                where: {
                    /**
                     * @todo support where default and
                     */
                    [targetModel.Op.and]: {
                        [joinNodeSource]: sourceInstance[mergeModel.sourceModel.id],
                        ...targetIds.length && { [joinPropertyInTarget]: targetModel.Opf.in(targetIds) }
                    }
                },
                joins: [
                    mergeModel.leftJoin({
                        collection: sourceModel.collection,
                        on: {
                            [joinNodeSource]: mergeModel.refTableCol({
                                table: sourceModel.collection,
                                column: sourceModel.id
                            }),
                        }
                    })
                ],
                filterQueryResult (_results) {
                    if (zeroChecking.is) {
                        zeroChecking.existed = !!_results.length && _results.some((x: any) => x && !!x[joinPropertyInTarget])
                    } else {
                        _results.forEach(({[joinPropertyInTarget]: alias_id}: any) => {
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
                    const ss = { [joinNodeSource]: mergeModel.propIdentifier(joinNodeSource) };
                    targetModel.propertyList.forEach(property => {
                        ss[property.mapsTo] = targetModel.propIdentifier(property)
                    })
                    return ss
                })(),
                where: {
                    [joinNodeSource]: sourceInstance[mergeModel.sourceModel.id]
                },
                joins: [
                    mergeModel.leftJoin({
                        collection: sourceModel.collection,
                        on: {
                            [joinNodeSource]: mergeModel.refTableCol({
                                table: sourceModel.collection,
                                column: sourceModel.id
                            }),
                        }
                    })
                ]
            })).map(x => x.$set(sourceAsKey, sourceInstance))
        },
        howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance, isAddOnly }) => {
            if (isEmptyArray(targetDataSet)) sourceInstance.$unlinkRef(mergeModel.name)
            const { targetModel, sourceModel } = mergeModel

            const mergeInsts = arraify(mergeModel.New(targetDataSet));
            if (mergeInsts && mergeInsts.length)
                sourceInstance[mergeModel.name] = sourceInstance[mergeModel.name] || []

            const mergeDataList = mergeInsts.map((mergeInst: FxOrmInstance.Class_Instance) => {
                if (!sourceInstance[sourceModel.id]) return ;
                mergeInst[joinNodeSource] = sourceInstance[sourceModel.id]

                mergeInst.$save()

                return mergeInst.toJSON()
            })

            if (isAddOnly && !mergeDataList.length)
                throw new Error(`[hasManyExclusively::howToSaveForSource(isAddOnly: true)] no any item provided`)
            else if (!isAddOnly && Array.isArray(sourceInstance[mergeModel.name]))
                sourceInstance[mergeModel.name].splice(0)

            sourceInstance[mergeModel.name] =
                deduplication(
                    <FxOrmInstance.Class_Instance[]>(sourceInstance[mergeModel.name] || [])
                        .concat(mergeDataList),
                    (item) => item[joinNodeTarget]
                )
                .map((x: Fibjs.AnyObject) => mergeModel.New(x).$set(sourceAsKey, sourceInstance))

        },
        howToUnlinkForSource: ({ mergeModel, targetInstances, sourceInstance }) => {
            const { targetModel } = mergeModel

            const targetIds = <string[]>[];
            targetInstances.forEach(x => {
                if (x.$isFieldFilled(joinNodeTarget)) targetIds.push(x[joinNodeTarget])
            });

            mergeModel.$dml.update(
                mergeModel.collection,
                { [joinNodeSource]: null },
                {
                    connection: this.orm.connection,
                    where: {
                        [joinNodeSource]: sourceInstance[mergeModel.sourceModel.id],
                        ...targetIds.length && { [joinNodeTarget]: targetModel.Opf.in(targetIds) }
                    }
                }
            )

            targetInstances.forEach(x => x.$set(sourceAsKey, null))
        },
        onFindByRef: ({ mergeModel, complexWhere, mergeModelFindOptions: findOptions }) => {
            const { sourceModel } = mergeModel
            findOptions = {...findOptions}

            return sourceModel.find({
                ...findOptions,
                select: (() => {
                    // const ss = { [joinNodeSource]: mergeModel.propIdentifier(joinNodeSource) };
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
                                        column: joinNodeSource
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

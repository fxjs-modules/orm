import util = require('util')
import { arraify } from "../../Utils/array";
import { isEmptyPlainObject } from '../../Utils/object';

export = function defineRef (
    this: FxOrmModel.Class_Model,
    ...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasOne']>
) {
    const [ targetModel = this, opts ] = args;

    const {
        as: asKey = `${targetModel.collection}`,
    } = opts || {}

    const mergePropertyNameInSource = `${asKey}_id`
    if (this.fieldInfo(asKey))
        throw new Error(`[MergeModel::hasOne] source model(collection: ${targetModel.collection}) already has field "${asKey}", it's not allowed to add one associated field to it.`)

    const mergeModel = this.defineAssociation({
        name: asKey,
        collection: this.collection,
        /**
         * @important pass {keys: false} to disable auto-fill id key
         */
        // keys: false,
        properties: {},
        type: 'o2o',
        target: targetModel,
        howToGetIdPropertyNames: ({ mergeModel }) => {
            return mergeModel.targetModel.ids
        },
        defineMergeProperties: ({ mergeModel }) => {
            const { targetModel, sourceModel } = mergeModel
            const tProperty = targetModel.properties[targetModel.id]
            if (!tProperty)
                throw new Error(`[MergeModel::defineMergeProperties/hasOne] no target property "${targetModel.id}" in target model, check your definition about 'defineMergeProperties'`)

            mergeModel.addProperty(
                mergePropertyNameInSource,
                tProperty
                    .renameTo({ name: mergePropertyNameInSource })
                    .useAsJoinColumn({ column: tProperty.name, collection: targetModel.collection })
                    .deKeys()
            )

            sourceModel.propertyList.forEach(sProperty => {
                if (mergeModel.fieldInfo(sProperty.name)) return ;

                mergeModel.addProperty(
                    sProperty.name,
                    sProperty
                        .renameTo({ name: sProperty.name })
                        .deKeys()
                )
            })
        },
        howToCheckExistenceForSource: ({ mergeModel, mergeInstance }) => {
            return mergeModel.sourceModel.idPropertyList.every(prop => mergeInstance.$isFieldFilled(prop.name))
        },
        howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance }) => {
            let targetInst = <FxOrmInstance.Class_Instance>util.last(arraify(targetDataSet))

            if (!mergeModel.targetModel.isInstance(targetInst)) targetInst = mergeModel.targetModel.New(<Fibjs.AnyObject>targetInst)

            targetInst.$save()

            const mergeInst = mergeModel.New(sourceInstance.toJSON())

            mergeInst[mergePropertyNameInSource] = targetInst[mergeModel.targetModel.id]

            mergeInst.$save();

            sourceInstance[mergeModel.name] = targetInst
        },
        howToCheckHasForSource: ({ mergeModel, targetInstances }) => {
            const { targetModel, sourceModel } = mergeModel

            const zeroChecking = {
                is: !targetInstances || (Array.isArray(targetInstances) && !targetInstances.length),
                existed: false
            }

            let results = <{[k: string]: boolean}>{};
            const targetIds = (targetInstances || []).map(x => {
                results[x[targetModel.id]] = false;
                return x[targetModel.id];
            })
            const alias = `${targetModel.collection}_${targetModel.id}`

            ;<FxOrmInstance.Class_Instance[]>(mergeModel.find({
                select: (() => {
                    const ss = { [mergePropertyNameInSource]: sourceModel.propIdentifier(sourceModel.id) };
                    /**
                     * @todo reduce unnecesary property
                     */
                    ss[alias] = mergeModel.propIdentifier(mergePropertyNameInSource)

                    return ss
                })(),
                where: {
                    [targetModel.Op.and]: {
                        ...targetIds.length && { [mergePropertyNameInSource]: targetModel.Opf.in(targetIds) }
                    }
                },
                joins: [
                    mergeModel.leftJoin({
                        collection: targetModel.collection,
                        on: {
                            [mergePropertyNameInSource]: mergeModel.refTableCol({
                                table: targetModel.collection,
                                column: targetModel.id
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
        howToFetchForSource: ({ mergeModel, sourceInstance }) => {
            const mergeInst = mergeModel.New({
                [mergeModel.sourceModel.id]: sourceInstance[mergeModel.sourceModel.id]
            });

            mergeInst.$fetch();

            const targetInst = mergeModel.targetModel.New({
                [mergeModel.targetModel.id]: sourceInstance[mergeModel.targetModel.id]
            });

            if (mergeInst[mergePropertyNameInSource] === null) {
                sourceInstance[mergeModel.name] = null;
                return
            }

            targetInst[targetModel.id] = mergeInst[mergePropertyNameInSource]
            targetInst.$fetch();

            sourceInstance[mergeModel.name] = targetInst;
        },
        howToUnlinkForSource: ({ mergeModel, sourceInstance }) => {
            const mergeInst = mergeModel.New({
                [mergeModel.sourceModel.id]: sourceInstance[mergeModel.sourceModel.id]
            });

            mergeInst.$fetch();
            mergeInst.$set(mergePropertyNameInSource, null).$save();

            sourceInstance[mergeModel.name] = null;
        },
        onFindByRef: ({ mergeModel, complexWhere, mergeModelFindOptions: findOptions }) => {
            if (!complexWhere || isEmptyPlainObject(complexWhere))
                throw new Error(`[MergeModel::hasOne::onFindByRef] find where options is required! check your input`)

            const { sourceModel, targetModel } = mergeModel
            findOptions = {...findOptions}

            return sourceModel.find({
                ...findOptions,
                select: (() => {
                    const ss = <Record<string, string>>{[mergePropertyNameInSource]: targetModel.propIdentifier(targetModel.id)};
                    sourceModel.propertyList.forEach(property =>
                        ss[property.mapsTo] = sourceModel.propIdentifier(property)
                    )
                    return ss
                })(),
                where: complexWhere,
                joins: [
                    <any>sourceModel.leftJoin({
                        collection: targetModel.collection,
                        on: {
                            [sourceModel.Op.and]: [
                                {
                                    [mergeModel.propIdentifier(mergePropertyNameInSource)]: targetModel.refTableCol({
                                        table: targetModel.collection,
                                        column: targetModel.id
                                    }),
                                },
                            ]
                        }
                    })
                ].concat(findOptions.joins ? arraify(findOptions.joins) : []),
                filterQueryResult: (_results) => {
                    return _results;
                }
            })
        },
    })

    this.associations[asKey] = mergeModel

    return mergeModel
}

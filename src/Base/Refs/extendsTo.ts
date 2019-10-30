import util = require('util')
import { arraify } from "../../Utils/array";
import { isEmptyPlainObject } from '../../Utils/object';
import { getRefPrefixInfo } from '../../Utils/select-property';

export = function defineRef (
    this: FxOrmModel.Class_Model,
    ...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['extendsTo']>
) {
    const [ properties, opts ] = args;

    if (!properties || isEmptyPlainObject(properties))
        throw new Error(`[MergeModel::extendsTo] properties must be valid property-definitions.`)

    const {
        as: asKey,
        collection = `${this.collection}_${asKey}`,
        sourceForJoin = this.id,
        joinNodeSource = `${this.collection}_id`
    } = <typeof opts>(opts || {})

    if (!asKey) throw new Error(`[MergeModel::extendsTo] options.as is required.`)
    if (!collection) throw new Error(`[MergeModel::extendsTo] options.collection is required.`)
    if (collection === this.collection) throw new Error(`[MergeModel::extendsTo] options.collection cannot be one of source model(collection: ${this.collection})`)

    if (this.fieldInfo(asKey))
        throw new Error(`[MergeModel::extendsTo] source model(collection: ${this.collection}) already has field "${asKey}", it's not allowed to add one associated field to it.`)

    const mergeModel = this.defineAssociation({
        name: asKey,
        collection,
        properties: properties,
        type: 'o2o',
        target: null,
        howToCheckExistenceWhenNoKeys: ({ instance }) => {
            if (!instance.$isFieldFilled(joinNodeSource) || !instance[joinNodeSource]) return false

            return !!mergeModel.count({ where: { [joinNodeSource]: instance[joinNodeSource] } })
        },
        howToGetIdPropertyNames: ({ mergeModel }) => {
            return [joinNodeSource]
        },
        defineMergeProperties: ({ mergeModel }) => {
            const { sourceModel } = mergeModel
            const sProperty = sourceModel.properties[sourceForJoin]
            if (!sProperty)
                throw new Error(`[MergeModel::defineMergeProperties/extendsTo] no source property "${sourceForJoin}" in source model, check your definition about 'defineMergeProperties'`)

            mergeModel.addProperty(
                joinNodeSource,
                sProperty
                    .renameTo({ name: joinNodeSource })
                    .useAsJoinColumn({ column: sProperty.name, collection })
                    .deKeys()
            )

            // ref itself
            mergeModel.targetModel = mergeModel
        },
        howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance }) => {
            let mergeInst = <FxOrmInstance.Class_Instance>util.last(arraify(targetDataSet))

            if (!mergeModel.isInstance(mergeInst)) mergeInst = mergeModel.New(<Fibjs.AnyObject>mergeInst)
            mergeInst[joinNodeSource] = sourceInstance[sourceForJoin]
            mergeInst.$save()

            sourceInstance[mergeModel.name] = mergeInst
        },
        howToCheckHasForSource: ({ mergeModel, sourceInstance }) => {
            const { sourceModel } = mergeModel

            const zeroChecking = { is: true, existed: false }

            ;<FxOrmInstance.Class_Instance[]>(mergeModel.find({
                select: { [joinNodeSource]: mergeModel.propIdentifier(joinNodeSource) },
                where: {
                    [mergeModel.propIdentifier(joinNodeSource)]: sourceInstance[sourceForJoin]
                },
                joins: [
                    mergeModel.leftJoin({
                        collection: sourceModel.collection,
                        on: {
                            [joinNodeSource]: sourceModel.refTableCol({
                                table: sourceModel.collection,
                                column: sourceModel.id
                            }),
                        }
                    })
                ],
                limit: 1,
                filterQueryResult (_results) {
                    zeroChecking.existed = !!_results.length && _results.some((x: any) => x && !!x[joinNodeSource])

                    return _results
                }
            }))

            return {
                final: zeroChecking.existed,
                ids: {}
            }
        },
        howToFetchForSource: ({ mergeModel, sourceInstance }) => {
            const mergeInst = mergeModel.New({ [joinNodeSource]: sourceInstance[sourceForJoin] });

            mergeInst.$fetch();

            if (mergeInst[joinNodeSource] === null) {
                sourceInstance[mergeModel.name] = null;
                return
            }

            sourceInstance[mergeModel.name] = mergeInst;
        },
        howToUnlinkForSource: ({ mergeModel, sourceInstance }) => {
            const mergeInst = mergeModel.New({ [joinNodeSource]: sourceInstance[sourceForJoin] });

            mergeInst.$remove();
            sourceInstance[mergeModel.name] = null;
        },
        onFindByRef: ({ mergeModel, complexWhere, mergeModelFindOptions: findOptions }) => {
            if (!complexWhere || isEmptyPlainObject(complexWhere))
                throw new Error(`[MergeModel::extendsTo::onFindByRef] find where options is required! check your input`)

            const { sourceModel } = mergeModel
            findOptions = {...findOptions}

            const { sprefix, splen, mprefix, mplen } = getRefPrefixInfo()

            return sourceModel.find({
                ...findOptions,
                select: (() => {
                    const ss = <Record<string, string>>{[joinNodeSource]: mergeModel.propIdentifier(joinNodeSource)};
                    sourceModel.propertyList.forEach(sproperty =>
                        ss[`${sprefix}${sproperty.name}`] = sourceModel.propIdentifier(sproperty.mapsTo)
                    )

                    mergeModel.propertyList.forEach(mproperty =>
                        ss[`${mprefix}${mproperty.name}`] = mergeModel.propIdentifier(mproperty)
                    )
                    return ss
                })(),
                where: complexWhere,
                joins: [
                    <any>sourceModel.leftJoin({
                        collection: mergeModel.collection,
                        on: {
                            [mergeModel.propIdentifier(joinNodeSource)]: mergeModel.refTableCol({
                                table: mergeModel.collection,
                                column: joinNodeSource
                            })
                        }
                    })
                ].concat(findOptions.joins ? arraify(findOptions.joins) : []),
                filterQueryResult: (_results) => {
                    let mergeKv = <any>{}
                    let sourceKv = <any>{}

                    return _results.map((item: any) => {
                        mergeKv = {}
                        sourceKv = {}
                        Object.keys(item).forEach(itemk => {
                            if (itemk.startsWith(mprefix)) {
                                mergeKv[itemk.slice(mplen)] = item[itemk]
                            } else if (itemk.startsWith(sprefix)) {
                                sourceKv[itemk.slice(splen)] = item[itemk]
                            }
                        })

                        sourceKv[asKey] = mergeKv

                        return sourceKv
                    })
                }
            })
        },
    })

    this.associations[asKey] = mergeModel

    return mergeModel
}

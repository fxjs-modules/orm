/// <reference path="ORM.d.ts" />

declare namespace FxOrmNS {
    /* compatible :start */
    export type Model = FxOrmModel.Model
    export type Hooks = FxOrmModel.Hooks
    export type FibOrmFixedExtendModel = FxOrmModel.Model

    export type ModelPropertyDefinition = FxOrmModel.ModelPropertyDefinition
    export type OrigDetailedModelProperty = FxOrmModel.OrigDetailedModelProperty
    export type OrigDetailedModelPropertyHash = FxOrmModel.OrigDetailedModelPropertyHash
    export type OrigModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition
    export type ModelPropertyDefinitionHash = FxOrmModel.ModelPropertyDefinitionHash
    export type ModelOptions = FxOrmModel.ModelOptions
    export type OrigHooks = FxOrmModel.Hooks
    
    export type ComplexModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition
    export type FibOrmFixedModelOptions = FxOrmModel.ModelOptions
    export type ValidationOptionHash = FxOrmValidators.ValidationOptionHash
    export type PatchedSyncfiedModelOrInstance = FxOrmPatch.PatchedSyncfiedModelOrInstance
    export type PatchedSyncfiedInstanceWithDbWriteOperation = FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation
    export type PatchedSyncfiedInstanceWithAssociations = FxOrmPatch.PatchedSyncfiedInstanceWithAssociations

    export type SettingsContainerGenerator = FxOrmSettings.SettingsContainerGenerator
    export type SettingInstance = FxOrmSettings.SettingInstance

    export type ModelOptions__Find = FxOrmModel.ModelOptions__Find
    export type ModelQueryConditions__Find = FxOrmModel.ModelQueryConditions__Find
    export type ModelMethodCallback__Find = FxOrmModel.ModelMethodCallback__Find
    export type ModelMethodCallback__Count = FxOrmModel.ModelMethodCallback__Count
    
    export type InstanceDataPayload = FxOrmInstance.InstanceDataPayload

    export type QueryConditionInTypeType = FxOrmQuery.QueryConditionInTypeType
    export type QueryCondition_SimpleEq = FxOrmQuery.QueryCondition_SimpleEq
    export type QueryCondition_eq = FxOrmQuery.QueryCondition_eq
    export type QueryCondition_ne = FxOrmQuery.QueryCondition_ne
    export type QueryCondition_gt = FxOrmQuery.QueryCondition_gt
    export type QueryCondition_gte = FxOrmQuery.QueryCondition_gte
    export type QueryCondition_lt = FxOrmQuery.QueryCondition_lt
    export type QueryCondition_lte = FxOrmQuery.QueryCondition_lte
    export type QueryCondition_like = FxOrmQuery.QueryCondition_like
    export type QueryCondition_not_like = FxOrmQuery.QueryCondition_not_like
    export type QueryCondition_between = FxOrmQuery.QueryCondition_between
    export type QueryCondition_not_between = FxOrmQuery.QueryCondition_not_between
    export type QueryCondition_in = FxOrmQuery.QueryCondition_in
    export type QueryCondition_not_in = FxOrmQuery.QueryCondition_not_in
    export type QueryConditionAtomicType = FxOrmQuery.QueryConditionAtomicType
    export type QueryConditions = FxOrmQuery.QueryConditions
    /* compatible :end */
}
import FibOrmNS = FxOrmNS

declare module "@fxjs/orm" {
    const mod: FxOrmNS.ExportModule
    export = mod
}

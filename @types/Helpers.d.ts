/// <reference path="hook.d.ts" />

declare namespace FxOrmHelper {
   // type HookTrigger<TTHIS = any> = FxOrmHook.HookTrigger<TTHIS>
   // type HookWait<TTHIS = any, TNEXT = any> = FxOrmHook.HookWait<TTHIS, TNEXT>
   interface HelperModules {
      parseDbConfig (config: string | FxOrmNS.IConnectionOptions, cb?: FxOrmNS.IConnectionCallback): FxOrmNS.IDBConnectionConfig | FxOrmNS.ORMLike

      get_many_associations_from_instance_by_extname (instance: FxOrmNS.Instance): FxOrmAssociation.InstanceAssociationItem_HasMany[]
      get_one_associations_from_instance_by_extname (instance: FxOrmNS.Instance): FxOrmAssociation.InstanceAssociationItem_HasOne[]
      get_extendsto_associations_from_instance_by_extname (instance: FxOrmNS.Instance): FxOrmAssociation.InstanceAssociationItem_ExtendTos[]

      getManyAssociationItemFromInstanceByExtname (instance: FxOrmNS.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem_HasMany
      getOneAssociationItemFromInstanceByExtname (instance: FxOrmNS.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem_HasOne
      getExtendsToAssociationItemFromInstanceByExtname (instance: FxOrmNS.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem_ExtendTos
      getAssociationItemFromInstanceByExtname (reltype: string, inst: FxOrmInstance.Instance, extend_name: string): FxOrmAssociation.InstanceAssociationItem

      getManyAssociationItemFromInstanceByAssocModel (instance: FxOrmNS.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasMany
      getOneAssociationItemFromInstanceByAssocModel (instance: FxOrmNS.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasOne
      getExtendsToAssociationItemFromInstanceByAssocModel (instance: FxOrmNS.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_ExtendTos
      getAssociationItemFromInstanceByAssocModel (reltype: string, inst: FxOrmInstance.Instance, assoc_model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem

      getManyAssociationItemFromModel (extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasMany
      getOneAssociationItemFromModel (extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_HasOne
      getExtendsToAssociationItemFromModel (extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem_ExtendTos
      getAssociationItemFromModel (reltype: string, extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem
      tryGetAssociationItemFromModel (extend_name: string, _model: FxOrmModel.Model): FxOrmAssociation.InstanceAssociationItem

      prependHook (hooks: FxOrmModel.Hooks, hookName: FxOrmModel.keyofHooks, preLogic: FxOrmHook.HookActionCallback | FxOrmHook.HookResultCallback): void
      preReplaceHook (m: FxOrmModel.Model, opts: FxOrmModel.ModelOptions, hookName: FxOrmModel.keyofHooks, cb: (this: FxOrmInstance.Instance, inst: FxOrmInstance.Instance) => void): void
      hookTrigger: FxOrmHook.HookTrigger<any>
      hookWait: FxOrmHook.HookWait<any, any>

      selectArgs (
         args: ArrayLike<any>,
         callback: {
            (
               arg_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function",
               arg: any,
               idx: number
            ): void
         }
      ): void

      valueOrComputeFunction <T = Exclude<any, Function>> (
         input: T | ((...args: any[]) => T),
         args?: any[],
         thisArg?: any
      ): T
   }
}
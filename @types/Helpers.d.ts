declare namespace FxOrmHelper {
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

      prependHook (hooks: FxOrmNS.Hooks, hookName: keyof FxOrmNS.Hooks, preLogic: FxOrmNS.Hooks[keyof FxOrmNS.Hooks]): void
      preReplaceHook (m: FxOrmModel.Model, opts: FxOrmModel.ModelOptions, hookName: keyof FxOrmNS.Hooks, cb: (this: FxOrmInstance.Instance, inst: FxOrmInstance.Instance) => void): void

      selectArgs (
         args: ArrayLike<any>,
         callback: {
            (
               arg_type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function",
               arg: any
            ): void
         }
      ): void
   }
}
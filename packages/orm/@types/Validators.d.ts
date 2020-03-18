/// <reference types="@fibjs/enforce" />

declare namespace FxOrmValidators {
   interface ValidatorModules {
        required: FibjsEnforce.enforcementValidation
        notEmptyString: FibjsEnforce.enforcementValidation
        rangeNumber: FibjsEnforce.enforcementValidation
        rangeLength: FibjsEnforce.enforcementValidation
        insideList: FibjsEnforce.enforcementValidation
        outsideList: FibjsEnforce.enforcementValidation
        password: FibjsEnforce.enforcementValidation

        patterns: FibjsEnforce.enforcementsContainer

        /* extra validators: start */
        equalToProperty(name: string, message?: string): FibjsEnforce.ValidationCallback;
        unique(opts?: { ignoreCase: boolean }, message?: string): FibjsEnforce.ValidationCallback;
        /* extra validators: end */
   }

   interface IValidatorHash {
      [validation: string]: FibjsEnforce.IValidator | FibjsEnforce.IValidator[]
   }

   interface ValidationCallback<T_THIS = any> extends FibjsEnforce.ValidationCallback {
      (value: any, next: FxOrmNS.NextCallback, thisArg?: T_THIS, contexts?: ValidatorContext): void;
   }

   interface ValidatorContext extends FibjsEnforce.ContextMap {
      driver: FibOrmNS.Class_ORM['driver']
      instance: FxOrmInstance.Class_Instance
      model: FxOrmModel.Class_Model
   }
}
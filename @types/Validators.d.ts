/// <reference types="@fibjs/enforce" />

declare namespace FxOrmValidators {
   type FibjsEnforce = typeof enforce

   interface ValidatorModules {
        required: enforce.enforcementValidation
        notEmptyString: enforce.enforcementValidation
        rangeNumber: enforce.enforcementValidation
        rangeLength: enforce.enforcementValidation
        insideList: enforce.enforcementValidation
        outsideList: enforce.enforcementValidation
        password: enforce.enforcementValidation

        patterns: enforce.enforcementsContainer

        /* extra validators: start */
        equalToProperty(name: string, message?: string): enforce.ValidationCallback;
        unique(opts?: { ignoreCase: boolean }, message?: string): enforce.ValidationCallback;
        /* extra validators: end */
   }

   interface ValidationOptionHash {
      [validation: string]: enforce.IValidator | enforce.IValidator[]
      // [validation: string]: enforce.ValidationCallback | enforce.ValidationCallback[]
  }
}
/// <reference types="@fibjs/enforce" />

declare namespace FxOrmValidators {
   type FibjsEnforce = typeof enforce

   interface ValidatorModules {
        required: enforce.ValidationCallback
        notEmptyString: enforce.ValidationCallback
        rangeNumber: enforce.ValidationCallback
        rangeLength: enforce.ValidationCallback
        insideList: enforce.ValidationCallback
        outsideList: enforce.ValidationCallback
        password: enforce.ValidationCallback

        patterns: enforce.enforcementsContainer

        /* extra validators: start */
        equalToProperty(name: string, message?: string): enforce.ValidationCallback;
        unique(opts?: { ignoreCase: boolean }, message?: string): enforce.ValidationCallback;
        /* extra validators: end */
   }
}
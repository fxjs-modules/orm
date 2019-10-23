/// <reference path="model.d.ts" />

declare namespace FxOrmInstance {

    class Class_Instance {
        static isInstance (input: any): input is Class_Instance
        readonly $event_emitter: Class_EventEmitter
        readonly $kvs: Fibjs.AnyObject
        readonly $refs: {[k: string]: FxOrmInstance.Class_Instance | any}

        readonly $saved: boolean
        readonly $isPersisted: boolean
        readonly $changes: any
        readonly $changedFieldsCount: number
        /**
         * @description json format snapshot when instance creation
         */
        readonly $bornsnapshot: string

        readonly $model: FxOrmModel.Class_Model


        /**
         * @description create one instance from data input
         *
         * if input is just one instance, New() would create the new one rather than use old one
         *
         * @param input dataset for creating one instance
         */
        constructor (
            model: FxOrmModel.Class_Model,
            input?: Fibjs.AnyObject
        );

        $on: Class_EventEmitter['on']
        $off: Class_EventEmitter['off']
        $emit: Class_EventEmitter['emit']

        $set (prop: string | string[], value: any): this
        /**
         * @description
         *  fetch all properties(not all fields, not including associations) from remote endpoints,
         *  update instance automatically
         */
        $fetch (): this
        /**
         *
         * @description just fetch field name (list) from remote endpoints, but never update local instance,
         * just return field-value object
         */
        $get: FxOrmTypeHelpers.FuncReturnArrayOrItEleViaElementIdx0<
            (fieldName: string) => Fibjs.AnyObject
        >

        /**
         * @description
         *  fetch all references(associations) from remote endpoints,
         *  update instance automatically
         */
        $fetchRef (): this
        /**
         *
         * @description just fetch reference name (list) from remote endpoints, but never update local instance,
         * just return ref-value object
         */
        $getRef: FxOrmTypeHelpers.FuncReturnArrayOrItEleViaElementIdx0<
            (fieldName: string, opts?: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['find']>) => Class_Instance
        >
        /**
         *
         * @description just check if reference name (list) exist(s) in remote endpoints, but never update local instance,
         * just return check result
         */
        $hasRef: FxOrmTypeHelpers.FuncReturnArrayOrItEleViaElementIdx0<
            (fieldName: string) => boolean
        >

        $save: (kvs?: Fibjs.AnyObject) => this
        $saveRef: FxOrmTypeHelpers.FuncReturnArrayOrItEleViaElementIdx1<
            (refName: string, dataset: Fibjs.AnyObject | FxOrmInstance.Class_Instance) => Class_Instance
        >
        /**
         * @description only valid for reference(with name `refName`) 'x2m', such as hasMany, hasManyExclusively
         */
        $addRef: (refName: string, dataset: Fibjs.AnyObject | FxOrmInstance.Class_Instance) => Class_Instance[]

        /**
         * @description remove instance
         *
         * @warning this just unlink all references about it, but never delete any references-related records in remote enpoints
         * automatically --- this only delete instance itself
         */
        $remove (): void
        /**
         *
         * @description unlink reference with `name` in remote endpoints, update local instance
         *
         * @notice
         * - for `x2m` type reference's instance, this action would unlink ALL references of it
         * if no any specific instances/conditions specified, but NEVER DELETE records in remote
         * endpoints by default
         *
         * - for `x2o` type reference's instance, this action would unlink the only reference of it.
         */
        $unlinkRef (refName: string | string[]): this

        $exists (): boolean
        $clearChanges(fieldName?: string | string[]): void

        $isFieldFilled (fieldname: string): boolean

        toString (): string
        toJSON (): Class_Instance['$kvs'];

        [k: string]: any
    }
}

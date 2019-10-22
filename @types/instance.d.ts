/// <reference path="model.d.ts" />

declare namespace FxOrmInstance {

    class Class_Instance extends Class_EventEmitter {
        readonly $kvs: Fibjs.AnyObject
        readonly $refs: {[k: string]: FxOrmInstance.Class_Instance | any}

        readonly $saved: boolean
        readonly $isPersisted: boolean
        readonly $changes: any
        readonly $changedFieldsCount: number

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
        $get (fieldName: string | string[]): Fibjs.AnyObject

        /**
         * @description
         *  fetch all references(associations) from remote endpoints,
         *  update instance automatically
         */
        $fetchReference (): this
        /**
         *
         * @description just fetch reference name (list) from remote endpoints, but never update local instance,
         * just return ref-value object
         */
        $getReference: FxOrmTypeHelpers.ReturnItemOrArrayAccordingTo_1stParam<string, Class_Instance>
        /**
         *
         * @description just check if reference name (list) exist(s) in remote endpoints, but never update local instance,
         * just return check result
         */
        $hasReference: FxOrmTypeHelpers.ReturnItemOrArrayAccordingTo_1stParam<string, boolean>

        $save: {
            (kvs?: Fibjs.AnyObject): Class_Instance
        }
        /**
         * @description remove instance
         */
        $remove (): void
        /**
         *
         * @description remove reference with `name` in remote endpoints, update local instance
         */
        $removeReference (refName: string | string[]): this

        $exists (): boolean
        $clearChanges(fieldName?: string | string[]): void


        toString (): string
        toJSON (): Class_Instance['$kvs'];

        [k: string]: any
    }
}

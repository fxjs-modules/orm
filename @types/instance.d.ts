/// <reference path="model.d.ts" />

declare namespace FxOrmInstance {

    class Class_Instance extends Class_EventEmitter {
        readonly $kvs: Fibjs.AnyObject

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
         
        $set (prop: string | string[], value: any): void
        /**
         * @description
         *  fetch all properties(not all fields, not includes associations) from remote endpoints,
         *  update instance automatically
         */
        $fetch (): this
        /**
         * 
         * @param fieldName just fetch field name (list) from remote endpoints, but never update local instance,
         * just return field-value object
         */
        $get (fieldName: string | string[]): Fibjs.AnyObject
        $save: {
            (kvs?: Fibjs.AnyObject): Class_Instance
            (kvs: Fibjs.AnyObject[]): Class_Instance[]
        }
        $remove (): void
        $exists (): boolean
        $clearChanges(fieldName?: string | string[]): void


        toString (): string
        toJSON (): Class_Instance['$kvs'];

        [k: string]: any
    }
}
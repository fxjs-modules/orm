/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />

declare namespace FxOrmDTransformer {
    interface CustomTypes {
        [key: string]: FxOrmProperty.CustomPropertyType
    }
    interface Transformer {
        storeType: 'sqlite' | 'mysql' | 'mongodb' | string
        
        /**
         * @description ONLY transform data value in remote to local format
         * 
         * @param value 
         * @param property 
         * @param customTypes 
         */
        valueToProperty<T_CTX = any> (value: any, property: FxOrmModel.Class_Model['properties'][any], customTypes: CustomTypes): any

        /**
         * @description ONLY transform local data value to remote format
         * 
         * @param propertyValue 
         * @param property 
         * @param customTypes 
         */
        propertyToValue<T_CTX = any> (propertyValue: any, property: FxOrmModel.Class_Model['properties'][any], customTypes: CustomTypes): any
    }
}
import type {
    FxOrmSqlDDLSync__Driver
} from "@fxjs/sql-ddl-sync";

import type {
    FxSqlQuery,
} from '@fxjs/sql-query';

import type { IProperty } from "@fxjs/orm-property";

export namespace FxOrmProperty {
    /**
     * @description key linked association type
     *  - 'primary': means this property is for column defined as 'primary'
     *  - 'hasOne': means this property is for column used as asscociated key in 'hasOne' assciation
     *  - 'extendsTo': means this property is for column used as asscociated key in 'extendsTo' assciation
     */
    export type KlassType = 'primary' | 'hasOne' | 'extendsTo'

    export interface CustomPropertyType extends FxOrmSqlDDLSync__Driver.CustomPropertyType {
        datastoreType: {
            (prop?: FxOrmProperty.NormalizedProperty): string
        }
        valueToProperty?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty): any
        }
        propertyToValue?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty): any
        }
        datastoreGet?: {
            (prop?: FxOrmProperty.NormalizedProperty, helper?: FxSqlQuery.Class_Query): any
        }
    }
    
    export type DataStoreProperty = IProperty;
    /**
     * @description useful when pass property's option(such as type, big, ...etc) internally, useless for exposed api.
     * 
     * @notice though there's definition, but those fields SHOULD NEVER be set in NormalizedProperty:
     * - `serial`
     */
    export interface NormalizedProperty extends DataStoreProperty {
        // all fields inherited from `FxOrmModel.ModelPropertyDefinition` are still optional

        key?: boolean
        klass?: KlassType
        lazyload?: boolean
        alwaysValidate?: boolean
        lazyname?: string
    }

    /**
     * @deprecated use Record<string, NormalizedProperty> instead
     */
    export interface NormalizedPropertyHash {
        [key: string]: NormalizedProperty
    }

    export interface FieldToPropertyMapType {
        [f_name: string]: NormalizedProperty
    }
}
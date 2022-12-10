import type { FxOrmSqlDDLSync__Driver } from "@fxjs/sql-ddl-sync";
import type { FxSqlQuery } from '@fxjs/sql-query';
import type { IProperty } from "@fxjs/orm-property";
export declare namespace FxOrmProperty {
    /**
     * @description key linked association type
     *  - 'primary': means this property is for column defined as 'primary'
     *  - 'hasOne': means this property is for column used as asscociated key in 'hasOne' assciation
     *  - 'extendsTo': means this property is for column used as asscociated key in 'extendsTo' assciation
     */
    type KlassType = 'primary' | 'hasOne' | 'extendsTo';
    interface CustomPropertyType extends FxOrmSqlDDLSync__Driver.CustomPropertyType {
        datastoreType: {
            (prop?: FxOrmProperty.NormalizedProperty): string;
        };
        valueToProperty?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty): any;
        };
        propertyToValue?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty): any;
        };
        datastoreGet?: {
            (prop?: FxOrmProperty.NormalizedProperty, helper?: FxSqlQuery.Class_Query): any;
        };
    }
    type DataStoreProperty = IProperty & {
        type: PropertyType | keyof GlobalCustomModelType;
        /**
         * @description virtual property is not stored in database,
         * but maybe presented in query result
         */
        virtual?: boolean;
    };
    type PropertyType = 'text' | 'integer' | 'number' | 'serial' | 'boolean' | 'date' | 'binary' | 'object' | 'enum' | 'point';
    /**
     * @description used for augumenting model's properties type
     */
    interface GlobalCustomModelType {
    }
    type GetPrimitiveFromOrmPropertyType<T extends PropertyType = PropertyType> = T extends 'text' ? string : T extends 'enum' ? any[] : T extends 'integer' | 'number' | 'serial' ? number : T extends 'boolean' ? boolean : T extends 'date' ? number | Date : T extends 'binary' | 'object' | 'point' ? any : never;
    /**
     * @description useful when pass property's option(such as type, big, ...etc) internally, useless for exposed api.
     *
     * @notice though there's definition, but those fields SHOULD NEVER be set in NormalizedProperty:
     * - `serial`
     */
    interface NormalizedProperty extends DataStoreProperty {
        key?: boolean;
        klass?: KlassType;
        lazyload?: boolean;
        alwaysValidate?: boolean;
        lazyname?: string;
    }
    interface FieldToPropertyMapType {
        [f_name: string]: NormalizedProperty;
    }
}

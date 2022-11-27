import { expectType } from "ts-expect";

import { FxOrmModel } from "../src";

declare var textType1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'text'
}>
expectType<string>(textType1)

declare var textType2: FxOrmModel.GetPropertiesTypeFromDefinition<'text'>
expectType<string>(textType2)

declare var textType3: FxOrmModel.GetPropertiesTypeFromDefinition<StringConstructor>
expectType<string>(textType3)

// number
declare var number1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'number'
}>
expectType<number>(number1)

declare var number2: FxOrmModel.GetPropertiesTypeFromDefinition<'number'>
expectType<number>(number2)

declare var number3: FxOrmModel.GetPropertiesTypeFromDefinition<NumberConstructor>
expectType<number>(number3)

// boolean
declare var boolean1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'boolean'
}>
expectType<boolean>(boolean1)

declare var boolean2: FxOrmModel.GetPropertiesTypeFromDefinition<'boolean'>
expectType<boolean>(boolean2)

declare var boolean3: FxOrmModel.GetPropertiesTypeFromDefinition<BooleanConstructor>
expectType<boolean>(boolean3)

// date
declare var date1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'date'
}>
expectType<Date | number>(date1)

declare var date2: FxOrmModel.GetPropertiesTypeFromDefinition<'date'>
expectType<Date | number>(date2)

declare var date3: FxOrmModel.GetPropertiesTypeFromDefinition<DateConstructor>
expectType<Date | number>(date3)

// enums
declare var enums1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'enum',
    values: ['a', 'b', 'c']
}>
expectType<'a' | 'b' | 'c'>(enums1)

declare var enums2: FxOrmModel.GetPropertiesTypeFromDefinition<['a', 'b', 'c']>
expectType<'a' | 'b' | 'c'>(enums2)

// object
declare var object1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'object'
}>
expectType<any>(object1)

declare var object2: FxOrmModel.GetPropertiesTypeFromDefinition<'object'>
expectType<any>(object2)

declare var object3: FxOrmModel.GetPropertiesTypeFromDefinition<ObjectConstructor>
expectType<any>(object3)

// allow custom
declare var customType1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'customJson1'
}>
expectType<unknown>(customType1)

declare module "../src" {
    export namespace FxOrmModel {
        interface GlobalCustomModelType {
            customJson: { foo: 'bar' }
        }
    }
}

declare var customType2: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'customJson'
}>
expectType<{ foo: 'bar' }>(customType2)

// all
declare var definitions: FxOrmModel.GetPropertiesType<{
    name1: 'text',
    name2: { type: 'text'},
    name3: StringConstructor,

    age1: 'number',
    age2: { type: 'number' },
    age3: NumberConstructor,

    gender1: ['male', 'female'],
    gender2: { type: 'enum', values: ['male', 'female'] }

    isStudent1: 'boolean',
    isStudent2: { type: 'boolean' },
    isStudent3: BooleanConstructor,

    birthday1: 'date',
    birthday2: { type: 'date' },
    birthday3: DateConstructor,

    info1: 'object',
    info2: { type: 'object' },
    info3: ObjectConstructor,
}>

expectType<string>(definitions.name1)
expectType<string>(definitions.name2)
expectType<string>(definitions.name3)

expectType<number>(definitions.age1)
expectType<number>(definitions.age2)
expectType<number>(definitions.age3)

expectType<'male' | 'female'>(definitions.gender1)
expectType<'male' | 'female'>(definitions.gender2)


expectType<boolean>(definitions.isStudent1)
expectType<boolean>(definitions.isStudent2)
expectType<boolean>(definitions.isStudent3)

expectType<Date | number>(definitions.birthday1)
expectType<Date | number>(definitions.birthday2)
expectType<Date | number>(definitions.birthday3)

expectType<any>(definitions.info1)
expectType<any>(definitions.info2)
expectType<any>(definitions.info3)



import { expectType } from "ts-expect";

import { FxOrmModel } from "../src";


declare var textType1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'text'
}>
expectType<string>(textType1)

declare var textType2: FxOrmModel.GetPropertiesTypeFromDefinition<StringConstructor>
expectType<string>(textType2)

// number
declare var number1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'number'
}>
expectType<number>(number1)

declare var number2: FxOrmModel.GetPropertiesTypeFromDefinition<NumberConstructor>
expectType<number>(number2)

// boolean
declare var boolean1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'boolean'
}>
expectType<boolean>(boolean1)

declare var boolean2: FxOrmModel.GetPropertiesTypeFromDefinition<BooleanConstructor>
expectType<boolean>(boolean2)

// date
declare var date1: FxOrmModel.GetPropertiesTypeFromDefinition<{
    type: 'date'
}>
expectType<Date | number>(date1)

declare var date2: FxOrmModel.GetPropertiesTypeFromDefinition<DateConstructor>
expectType<Date | number>(date2)

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

declare var object2: FxOrmModel.GetPropertiesTypeFromDefinition<ObjectConstructor>
expectType<any>(object2)

// all
declare var definitions: FxOrmModel.GetPropertiesType<{
    name: StringConstructor,
    age: NumberConstructor,
    isMale: BooleanConstructor,
    birthday: DateConstructor,
    info: ObjectConstructor
}>

expectType<string>(definitions.name)
expectType<number>(definitions.age)
expectType<boolean>(definitions.isMale)
expectType<Date | number>(definitions.birthday)


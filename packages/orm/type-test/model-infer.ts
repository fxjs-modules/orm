import { expectType } from "ts-expect";

import { FxOrmModel } from "../src";

string: {
    var textType1: FxOrmModel.GetPropertiesTypeFromDefinition<{
        type: 'text'
    }>
    expectType<string>(textType1)

    var textType2: FxOrmModel.GetPropertiesTypeFromDefinition<StringConstructor>
    expectType<string>(textType2)
}

number: {
    var number1: FxOrmModel.GetPropertiesTypeFromDefinition<{
        type: 'number'
    }>
    expectType<number>(number1)

    var number2: FxOrmModel.GetPropertiesTypeFromDefinition<NumberConstructor>
    expectType<number>(number2)
}

boolean: {
    var boolean1: FxOrmModel.GetPropertiesTypeFromDefinition<{
        type: 'boolean'
    }>
    expectType<boolean>(boolean1)

    var boolean2: FxOrmModel.GetPropertiesTypeFromDefinition<BooleanConstructor>
    expectType<boolean>(boolean2)
}

date: {
    var date1: FxOrmModel.GetPropertiesTypeFromDefinition<{
        type: 'date'
    }>
    expectType<Date | number>(date1)

    var date2: FxOrmModel.GetPropertiesTypeFromDefinition<DateConstructor>
    expectType<Date | number>(date2)
}

object: {
    var object1: FxOrmModel.GetPropertiesTypeFromDefinition<{
        type: 'object'
    }>
    expectType<any>(object1)

    var object2: FxOrmModel.GetPropertiesTypeFromDefinition<ObjectConstructor>
    expectType<any>(object2)
}

all: {
    var definitions: FxOrmModel.GetPropertiesType<{
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
}


/// <reference types="@types/nearley" />

declare namespace FxHQLTypeHelpers {
    type Parameters<T> = T extends (...args: infer T) => any ? T : never;
    type FirstParameter<T> = T extends (arg: infer T, ...args: any[]) => any ? T : never;
    type SecondParameter<T> = T extends (arg1: any, arg: infer T, ...args: any[]) => any ? T : never;
    type _3rdParameter<T> = T extends (arg1: any, arg2: any, arg: infer T, ...args: any[]) => any ? T : never;

    type ReturnType<T> = T extends (...args: any[]) => infer T ? T : never;

    type InstanceOf<T> = T extends new (...args: any[]) => infer T ? T : never;

    type ConstructorParams<T> = T extends {
        new (...args: infer U): any
    } ? U : never

    type ReturnItemOrArrayAccordingTo_1stParam<T, RETURN_T, EXTRA_T = void> = {
        (
            arg1: EXTRA_T extends void ? T : (T | EXTRA_T),
            ...args: any[]): T extends any[] ? RETURN_T[] : RETURN_T
    }

    type ReturnItemOrArrayAccordingTo_2ndParam<T, RETURN_T, EXTRA_T = void> = {
        (
            arg1: any,
            arg2: EXTRA_T extends void ? T : (T | EXTRA_T),
            ...args: any[]
        ): T extends any[] ? RETURN_T[] : RETURN_T
    }

    type ItOrListOfIt<T> = T | T[]

    type IndexInArrayOrKeyInObject<T> = T extends any[] ? number : keyof T
    type ItemInArrayOrValueInObject<T> = T extends any[] ? T[number] : T[keyof T]

    type T_OBJ_ONLY<T> = T extends object ? T : never
    type T_RECURSIVE_OBJ_ONLY<T> = T extends object ? T[keyof T] : never
}

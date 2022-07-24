import { IPropTransformer } from "./Property";

export function defineTransformer<T extends object>(opts: {
    rawToProperty: IPropTransformer<T>['rawToProperty']
    toStorageType: IPropTransformer<T>['toStorageType']
}): IPropTransformer<T> {
    const {
        rawToProperty,
        toStorageType,
    } = opts;

    return {
        rawToProperty,
        toStorageType,
    }
}
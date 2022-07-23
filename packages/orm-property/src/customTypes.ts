import { ICustomPropertyType } from "./Property";

const DEFAULT_DATASTORE_TYPE: ICustomPropertyType['datastoreType'] = function (prop, ctx) {
    return prop.type.toUpperCase();
};
export function defineCustomType (opts: Partial<ICustomPropertyType>): ICustomPropertyType {
    opts = {...opts}
    if (typeof opts.datastoreType !== 'function') {
        opts.datastoreType = DEFAULT_DATASTORE_TYPE.bind(null)
    }

    return opts as ICustomPropertyType
}
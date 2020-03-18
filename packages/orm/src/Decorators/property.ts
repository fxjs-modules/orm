export function buildDescriptor (descriptor: PropertyDescriptor): any {
    let { value = undefined } = descriptor
    
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Create new property with getter and setter
        Object.defineProperty(target, propertyKey, {
            get: () => value,
            set: (nval: any) => { value = nval },
            ...descriptor
        });
    };
}
export function enumerable (_enumerable: boolean) {
    let val: any = undefined
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Create new property with getter and setter
        Object.defineProperty(target, propertyKey, {
            get: () => val,
            set: (nval: any) => { val = nval },
            enumerable: !!_enumerable,
            configurable: true
        });
    };
}
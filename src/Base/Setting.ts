import { snapshot } from "../Utils/clone";
import { setTarget, getFrom, unsetTarget } from "../Utils/deep-kv";

/**
 * @description Settings is one global/local setting deep key-value management tools
 * 
 * ```Javascript
 * const settings = new Settings({})
 * 
 * settings.set('a', 'foo')
 * settings.get('a') // foo
 * settings.get('a.a') // undefined
 * 
 * settings.set('a.b', 'foo1')
 * settings.get('a.b') // 'foo1'
 * settings.get('a.b.c') // undefined
 * 
 * settings.set('a.b', 'foo1')
 * settings.get('a.b') // 'foo1'
 * settings.unset('a.b') // 'foo1'
 * settings.get('a.b') // undefined
 * ```
 */
class Settings {
    private _kvs: {[k: string]: any}

    constructor (initKvs: Settings['_kvs']) {
        this._kvs = {...snapshot(initKvs)};
    }

    set(k: string, v: any) {
        setTarget(k, v, this._kvs);
    }

    get(k: string, _default: any) {
        const v = getFrom(k, _default, this._kvs);

        return snapshot(v);
    }

    unset(...ks: any[]) {
        ks.forEach(k => {
            if (typeof k === 'string')
                unsetTarget(k, this._kvs);
        })
    }

    toJSON () {
        return snapshot(this._kvs)
    }

    clone () {
        return new Settings(this.toJSON())
    }
}

export default Settings

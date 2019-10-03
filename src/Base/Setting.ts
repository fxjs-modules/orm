import { snapshot } from "../Utils/clone";

function setTarget<T = any> (key: string, value: any, target: Fibjs.AnyObject): any {
    const p = key.indexOf(".");

	if (p === -1) {
		return target[key] = value;
	}

	if (!target.hasOwnProperty(key.substr(0, p))) {
		target[key.substr(0, p)] = {};
	}

	return setTarget(key.substr(p + 1), value, target[key.substr(0, p)]);
}

function getFrom(key: string, def: any, target: {[k: string]: any}): any {
	const p = key.indexOf(".");

	if (p === -1) {
		if (key === '*')
			return target;

		return target.hasOwnProperty(key) ? target[key] : def;
	}

	if (!target.hasOwnProperty(key.substr(0, p)))
		return def;

	return getFrom(key.substr(p + 1), def, target[key.substr(0, p)]);
}

function unsetTarget(key: string, obj: any): 'reset' | undefined {
	const p = key.indexOf(".");

	if (p === -1) {
		if (key === '*')
			return 'reset';
		else
			delete obj[key];

		return;
	}

	if (!obj.hasOwnProperty(key.substr(0, p)))
		return;

	if (unsetTarget(key.substr(p + 1), obj[key.substr(0, p)]) === 'reset')
		obj[key.substr(0, p)] = {};
}

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
}

export default Settings

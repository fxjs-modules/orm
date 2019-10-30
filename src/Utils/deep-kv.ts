export function setTarget (
	key: string,
	value: any,
	target: Fibjs.AnyObject
): any {
	if ((!target || typeof target !== 'object')) {
		return ;
	}

    const p = key.indexOf(".");

	if (p === -1) {
		return target[key] = value;
	}

    const nextKey = key.substr(0, p);
	if (!(nextKey in target)) {
		target[nextKey] = {};
	}

	return setTarget(key.substr(p + 1), value, target[nextKey]);
}

export function getFrom(key: string, def: any, target: {[k: string]: any}): any {
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

export function unsetTarget(key: string, obj: any): 'reset' | undefined {
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

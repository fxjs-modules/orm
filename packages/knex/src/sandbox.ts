import vm = require('vm')
import path = require('path')
import uuid = require('uuid')

const __root = path.resolve(__dirname, '../')

function patchMods (
    this: Box
) {
    this.add({
        'uuid': {
    		v4 () {
    			return uuid.snowflake();
    		}
        }
    })
}

export default class Box extends vm.SandBox {
    constructor () {
        const [ mods = {}, __require = function () {}, __global = undefined ] = Array.prototype.slice.apply(arguments)
        
        super({
            ...mods,
            'fs': require('fs'),
            'path': require('path'),
            'os': require('os'),
            'url': require('url'),
            'tty': require('tty'),
            'util': require('util'),
            'events': require('events'),
            'assert': require('assert'),
            'crypto': require('crypto'),
            'timers': require('timers'),
            'tarn': require('../deps/tarn/dist/tarn'),
        }, __require, __global)

        patchMods.call(this);
    }
}
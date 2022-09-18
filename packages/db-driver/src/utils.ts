/// <reference types="@fibjs/types" />

import url = require('url')
import util = require('util')
import tty  = require("tty");
import net = require('net')
import uuid = require('uuid')
import ParseQSDotKey = require('parse-querystring-dotkey')
import FibPool = require('fib-pool');
import { FxDbDriverNS } from './Typo'

export function driverUUid () {
    return uuid.node().hex()
}

export function filterDriverType (protocol: any): FxDbDriverNS.DriverType {
    switch (protocol) {
        case 'sqlite:':
            return 'sqlite';
        case 'mysql:':
            return 'mysql';
        case 'postgresql:':
        case 'postgres:':
        case 'pg:':
        case 'psql:':
            return 'psql';
        case 'redis:':
            return 'redis';
        // case 'mongodb:':
        //     return 'mongodb';
        default:
            return 'unknown'
    }
}

export function forceInteger (input: any, fallback: number) {
    try {
        input = parseInt(input)
    } catch (error) {
        input = null
    }

    if (input === null || isNaN(input))
        input = fallback

    return input as number
}

export function castQueryStringToBoolean (input: any) {
    switch (input) {
        case "1":
        case "true":
        case "y":
            return true
        case "0":
        case "false":
        case "no":
        case "n":
        case "":
            return false
        default:
            return !!input
    }
}

function unPrefix (str: string = '', prefix: string = '/') {
    if (!str || typeof str !== 'string') return ''

    if (str.slice(0, prefix.length) === prefix)
        str = str.slice(prefix.length)

    return str
}

export function ensureSuffix (str: string = '', suffix: string = '//') {
    if (!str || typeof str !== 'string') return ''

    const lidx = str.lastIndexOf(suffix)
    if (str.slice(lidx) !== suffix)
        str += suffix

    return str
}

export function parseConnectionString (input: any): FxDbDriverNS.DBConnectionConfig {
    input = input || {};
    let urlObj = input instanceof net.Url ? input : null;

    if (typeof input === 'string') {
        urlObj = url.parse(input);
        
        input = <FxDbDriverNS.DBConnectionConfig>{
            protocol: urlObj.protocol || null,
            slashes: urlObj.slashes || false,
            query: urlObj.query || null,
            username: urlObj.username || null,
            password: urlObj.password || null,
            host: urlObj.host || null,
            hostname: urlObj.hostname || null,
            port: urlObj.port || null,
            href: urlObj.href || null,
            database: unPrefix(urlObj.pathname, '/') || null,
            pathname: urlObj.pathname || null,

            // timezone: urlObj.query.timezone || null,
        };
    } else if (typeof input !== 'object') {
        input = {}
    }

    if (input.user && !input.username)
        input.username = input.user
        delete input.user;

    if (typeof input.query === 'string')
        input.query = ParseQSDotKey(input.query)

    input.query = Object.assign({}, input.query);
    input = Object.assign({}, input);
    input = util.pick(input, [
        'protocol',
        'slashes',
        'query',
        'database',
        'username',
        'password',
        'host',
        'hostname',
        'port',
        'href',
        'pathname',
    ])

    input.slashes = !!input.slashes
    input.port = forceInteger(input.port, null)

    return input
}

export function parsePoolConfig (
    input: boolean | FxDbDriverNS.ConnectionPoolOptions | any
): FxDbDriverNS.ConnectionPoolOptions {
    if (!input || input === true)
        return {};

    if (typeof input !== 'object')
        return {};

    const {
        maxsize = undefined,
        timeout = undefined,
        retry = undefined
    } = <FxDbDriverNS.ConnectionPoolOptions>(input || {})

    return {
        maxsize,
        timeout,
        retry
    }
}

export function mountPoolToDriver<CONN_TYPE = any> (
    driver: any,
    poolSetting = driver.config.pool
) {
    if (!driver.pool && poolSetting)
        driver.pool = FibPool<CONN_TYPE>({
            create: () => {
                return driver.getConnection()
            },
            destroy: (conn) => {
                return (conn as any).close()
            },
            ...parsePoolConfig(poolSetting)
        })
}

export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}

export function logDebugSQL (dbtype: string, sql: string) {
	let fmt: string;

	if (tty.isatty(process.stdout.fd)) {
		fmt = "\033[32;1m(orm/%s) \033[34m%s\033[0m\n";
		sql = sql.replace(/`(.+?)`/g, function (m) { return "\033[31m" + m + "\033[34m"; });
	} else {
		fmt = "[SQL/%s] %s\n";
	}

	process.stdout.write(
		util.format(fmt, dbtype, sql) as any
	);
};
/// <reference types="@fibjs/types" />

import url = require('url')
import util = require('util')
import net = require('net')
import uuid = require('uuid')
import ParseQSDotKey = require('parse-querystring-dotkey')
import FibPool = require('fib-pool');

export function driverUUid () {
    return uuid.node().hex()
}

export function filterDriverType (protocol: any): FxDbDriver__Driver.DriverType {
    switch (protocol) {
        case 'sqlite://':
        case 'sqlite:':
            return 'sqlite';
        case 'mysql://':
            return 'mysql';
        case 'redis://':
            return 'redis';
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

export function parseConnectionString (input: any): FxDbDriver__Driver.DBConnectionConfig {
    input = input || {};
    let urlObj = input instanceof net.Url ? input : null;

    if (typeof input === 'string') {
        urlObj = url.parse(input);
        
        input = <FxDbDriver__Driver.DBConnectionConfig>{
            protocol: urlObj.protocol || null,
            query: urlObj.query || null,
            username: urlObj.username || null,
            password: urlObj.password || null,
            host: urlObj.host || null,
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
        'query',
        'database',
        'username',
        'password',
        'host',
        'href',
        'pathname',
    ])

    return input
}

export function parsePoolConfig (
    input: boolean | FxDbDriver__Driver.ConnectionPoolOptions | any
): FxDbDriver__Driver.ConnectionPoolOptions {
    if (!input || input === true)
        return {};

    if (typeof input !== 'object')
        return {};

    const {
        maxsize = undefined,
        timeout = undefined,
        retry = undefined
    } = <FxDbDriver__Driver.ConnectionPoolOptions>(input || {})

    return {
        maxsize,
        timeout,
        retry
    }
}

export function mountPoolToDb (driver: FxDbDriver__Driver.Driver) {
    if (driver.config.pool)
        driver.pool = FibPool<FxDbDriver__Driver.Driver>({
            create: () => {
                return driver.connect()
            },
            destroy: (conn: FxDbDriver__Driver.Driver) => {
                return conn.close()
            },
            ...parsePoolConfig(driver.config.pool)
        })
}
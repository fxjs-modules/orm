/// <reference path="_common.d.ts" />

declare namespace FxDbDriver__Query {
    interface BasicDriverQueryObject {
        escapeVal (...args: any[]): string
        escapeId (...args: any[]): string

        [k: string]: any
    }
}
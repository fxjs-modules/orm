/// <reference types="@fibjs/types" />
/// <reference path="ORM.d.ts" />

import FibOrmNS = FxOrmNS

declare module "@fxjs/orm" {
    const mod: FxOrmNS.ExportModule
    export = mod
}

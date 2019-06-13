/// <reference path="instance.d.ts" />

declare namespace FxOrmHook {
    interface HookActionNextFunction<TTHIS = FxOrmInstance.Instance> {
        (this: TTHIS, err?: Error|null): any
    }

    interface HookActionCallback<TTHIS = FxOrmInstance.Instance> {
        (this: TTHIS, next?: HookActionNextFunction): any
    }

    interface HookResultCallback<TTHIS = FxOrmInstance.Instance> {
        (this: TTHIS, success?: boolean): any
    }

    interface HookTrigger<CTX_SELF = FxOrmInstance.Instance>{
        (self: CTX_SELF, cur: HookActionCallback | HookResultCallback, _: boolean): void
    }

    interface HookWait<CTX_SELF = FxOrmInstance.Instance, TNEXT=any>{
        (self: CTX_SELF, cur: HookActionCallback | HookResultCallback, saveAssociation: FxOrmNS.GenericCallback<void>, opts: object): void
        (self: CTX_SELF, cur: HookActionCallback | HookResultCallback, next: FxOrmNS.GenericCallback<TNEXT>): void
    }
}

/// <reference path="instance.d.ts" />

declare namespace FxOrmHook {
    interface HookActionNextFunction {
        (err?: Error|null): any
    }

    interface HookActionCallback {
        (next?: HookActionNextFunction): any
    }

    interface HookResultCallback {
        (success?: boolean): any
    }

    interface HookTrigger<CTX_SELF = FxOrmInstance.Instance>{
        (self: CTX_SELF, cur: HookActionCallback | HookResultCallback, _: boolean): void
    }

    interface HookWait<CTX_SELF = FxOrmInstance.Instance, TN=any>{
        (self: CTX_SELF, cur: HookActionCallback | HookResultCallback, saveAssociation: FxOrmNS.GenericCallback<void>, opts: object): void
        (self: CTX_SELF, cur: HookActionCallback | HookResultCallback, next: FxOrmNS.GenericCallback<TN>): void
    }
}

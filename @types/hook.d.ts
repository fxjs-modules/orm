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

    interface HookTrigger<T=any>{
        (self: FxOrmInstance.Instance, cb: HookActionCallback | HookResultCallback, _: boolean): void
    }

    interface HookWait<T=any, TN=any>{
        (self: FxOrmInstance.Instance, cb: HookActionCallback | HookResultCallback, saveAssociation: FxOrmNS.GenericCallback<void>, opts: object)
        (self: FxOrmInstance.Instance, cb: HookActionCallback | HookResultCallback, next: FxOrmNS.GenericCallback<TN>)
    }
}

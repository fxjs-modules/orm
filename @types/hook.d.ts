/// <reference path="_common.d.ts" />
/// <reference path="instance.d.ts" />

declare namespace FxOrmHook {
    interface HookActionNextFunction<TTHIS = FxOrmInstance.Instance> {
        (this: TTHIS, err?: Error|null): any
    }

    interface HookActionCallback<TTHIS = FxOrmInstance.Instance, TPAYLOAD = any> {
        (this: TTHIS, next?: HookActionNextFunction): any
        (this: TTHIS, arg1?: TPAYLOAD, next?: HookActionNextFunction): any
    }

    interface HookResultCallback<TTHIS = FxOrmInstance.Instance> {
        (this: TTHIS, success?: boolean): any
    }

    interface HookTrigger<CTX_SELF = FxOrmInstance.Instance, RESULT_TYPE = boolean>{
        (self: CTX_SELF, cur: FxOrmNS.Arraible<HookResultCallback>, _?: RESULT_TYPE, ...args: any): void
    }

    interface HookWait<CTX_SELF = FxOrmInstance.Instance, TNEXT=any>{
        (self: CTX_SELF, cur: FxOrmNS.Arraible<HookActionCallback | FxOrmNS.Arraible<HookActionCallback>>, saveAssociation: FxOrmNS.GenericCallback<void>, opts: object): void
        (self: CTX_SELF, cur: FxOrmNS.Arraible<HookActionCallback | FxOrmNS.Arraible<HookActionCallback>>, next: FxOrmNS.GenericCallback<TNEXT>): void
    }
}

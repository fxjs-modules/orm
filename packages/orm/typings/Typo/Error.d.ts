/// <reference types="@fibjs/enforce" />
/// <reference types="@fibjs/types" />
import { FxOrmInstance } from "./instance";
export declare namespace FxOrmError {
    interface PredefineErrorCodes {
        QUERY_ERROR: number;
        NOT_FOUND: number;
        NOT_DEFINED: number;
        NO_SUPPORT: number;
        MISSING_CALLBACK: number;
        PARAM_MISMATCH: number;
        CONNECTION_LOST: number;
        BAD_MODEL: number;
    }
    interface ExtendedError extends Error {
        code?: number | string;
        [ext: string]: any;
    }
    interface ValidateError extends FibjsEnforce.ValidationError {
        code?: number | string;
    }
    type ValidateErrorResult = ValidateError | ValidateError[];
    interface ErrorWaitor {
        evt?: Class_Event;
        err: FxOrmError.ExtendedError;
    }
    interface BatchOperationInstanceErrorItem extends ExtendedError {
        index: number;
        instance: FxOrmInstance.Instance;
    }
}

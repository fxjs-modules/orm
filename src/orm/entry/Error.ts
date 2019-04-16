const codes: FxOrmNS.PredefineErrorCodes = {
  QUERY_ERROR      : 1,
  NOT_FOUND        : 2,
  NOT_DEFINED      : 3,
  NO_SUPPORT       : 4,
  MISSING_CALLBACK : 5,
  PARAM_MISMATCH   : 6,
  CONNECTION_LOST  : 10,
  BAD_MODEL        : 15
};

export = class ORMError extends Error {
  static codes = codes;
  
  name: string = 'ORMError';

  message: string = '';
  code: number | string = 0;
  literalCode: string = '';

  [k: string]: any;
  
  constructor (message: string, code?: keyof FxOrmNS.PredefineErrorCodes, extras?: any) {
    super();

    Error.call(this);
    (Error as any).captureStackTrace(this, this.constructor);
  
    this.message = message;
    if (code) {
      this.code = codes[code];
      this.literalCode = code;
      if (!this.code) {
        throw new Error("Invalid error code: " +  code);
      }
    }
    if (extras) {
      for(let k in extras) {
        this[k] = extras[k];
      }
    }
  }

  toString () {
    return '[ORMError ' + this.literalCode + ': ' + this.message + ']';
  }
}

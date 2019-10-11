let count = 0;

const codes = {
    NO_SUPPORT: count++,
    QUERY_ERROR: count++,
    NOT_FOUND: count++,
    NOT_DEFINED: count++,
    MISSING_CALLBACK: count++,
    PARAM_MISMATCH: count++,
    CONNECTION_LOST: count++,
    BAD_MODEL: count++,
}

export default class ORMError extends Error {
  name: string = 'ORMError';

  message: string = '';
  code: number | string = 0;
  literalCode: string = '';

  [k: string]: any;
  
  constructor (message: string, code?: keyof typeof codes) {
    super();

    Error.call(this);
    (<any>Error).captureStackTrace(this, this.constructor);
  
    this.message = message;

    if (code) {
      this.code = codes[code];
      this.literalCode = code;
      if (!this.code) {
        throw new Error("Invalid error code: " +  code);
      }
    }
  }
}
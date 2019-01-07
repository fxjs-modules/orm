/// <reference path="../../../@types/DMLDriver.d.ts" />

import aliases = require('./Drivers/aliases');

export const add = addAdapter;
export const get = getAdapter;

const adapters = <{[key: string]: FxOrmDMLDriver.DMLDriverConstructor}>{};

function addAdapter(name: string, constructor: FxOrmDMLDriver.DMLDriverConstructor) {
  adapters[name] = constructor;
}

function getAdapter(name: string): FxOrmDMLDriver.DMLDriverConstructor {
  if (name in aliases) {
    return getAdapter(aliases[name]);
  } else if (!(name in adapters)) {
    adapters[name] = require("./Drivers/DML/" + name).Driver;
  }

  return adapters[name];
}

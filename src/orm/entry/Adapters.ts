import aliases = require('./Drivers/aliases');

export const add = addAdapter;
export const get = getAdapter;

const adapters = {};

function addAdapter(name: string, constructor: Function) {
  adapters[name] = constructor;
}

function getAdapter(name) {
  if (name in aliases) {
    return getAdapter(aliases[name]);
  } else if (!(name in adapters)) {
    adapters[name] = require("./Drivers/DML/" + name).Driver;
  }

  return adapters[name];
}

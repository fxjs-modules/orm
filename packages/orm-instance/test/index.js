const test = require('test');
test.setup();

const Mod = require('../')

describe("FxLib", () => {
    it("basic", () => {
        assert.ok(Mod.default === null)
    });
});

test.run(console.DEBUG);
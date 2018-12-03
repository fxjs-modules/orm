#!/usr/local/bin/fibjs

var test = require("test");
test.setup();

function t() {
    run('./integration/association-extend.js');
    run('./integration/association-hasmany-extra.js');
    run('./integration/association-hasmany-hooks.js');
    run('./integration/association-hasmany.js');
    run('./integration/association-hasone.js');
    run('./integration/association-hasone-required.js');
    run('./integration/association-hasone-reverse.js');
    run('./integration/association-hasone-zeroid.js');
    run('./integration/event.js');

    run('./integration/hook.js');

    run('./integration/instance.js');
    run('./integration/model-aggregate.js');
    run('./integration/model-clear.js');
    run('./integration/model-count.js');
    run('./integration/model-create.js');
    run('./integration/model-exists.js');
    run('./integration/model-find-chain.js');
    run('./integration/model-find-mapsto.js');
    run('./integration/model-find.js');
    run('./integration/model-get.js');
    run('./integration/model-keys.js');
    run('./integration/model-one.js');
    run('./integration/model-save.js');
    run('./integration/model-sync.js');

    run('./integration/predefined-validators.js');

    run('./integration/property-custom.js');
    run('./integration/property-lazyload.js');
    run('./integration/property-maps-to.js');
    run('./integration/property.js');

    run('./integration/settings.js');

    run('./integration/smart-types.js');

    run('./integration/validation.js');

    run('./integration/date-type.js');

    test.run(console.DEBUG);
}

t();
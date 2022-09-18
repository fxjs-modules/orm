#!/usr/local/bin/fibjs

var test = require("test");
test.setup();

function t() {
    run('./integration/orm-test-prepare.js')
    run('./integration/orm-exports.js');

    run('./integration/association-extend.js');
    run('./integration/association-extend.callback.js');

    run('./integration/association-hasmany-extra.js');
    run('./integration/association-hasmany-extra.callback.js');
    run('./integration/association-hasmany-hooks.js');
    run('./integration/association-hasmany-hooks.callback.js');
    run('./integration/association-hasmany.js');
    run('./integration/association-hasmany.callback.js');
    run('./integration/association-hasmany-mapsto.js');
    run('./integration/association-hasmany-mapsto.calback.js');
    
    run('./integration/association-hasone.js');
    run('./integration/association-hasone.callback.js');
    run('./integration/association-hasone-required.js');
    run('./integration/association-hasone-required.callback.js');
    run('./integration/association-hasone-reverse.js');
    run('./integration/association-hasone-reverse.callback.js');
    run('./integration/association-hasone-zeroid.js');
    run('./integration/association-hasone-zeroid.callback.js');
    run('./integration/association-hasone-issues.js');

    run('./integration/event.js');

    run('./integration/hook.js');
    run('./integration/hook-ref.js');
    run('./integration/hook-helpers.js');
    run('./integration/association-hook.js');

    run('./integration/instance.js');
    run('./integration/instance-issues.js');
    run('./integration/model-aggregate.js');
    run('./integration/model-clear.js');
    run('./integration/model-count.js');
    run('./integration/model-count.callback.js');
    run('./integration/model-create.js');
    run('./integration/model-create.callback.js');
    run('./integration/model-exists.js');
    run('./integration/model-find-chain.js');
    run('./integration/model-find-chain.callback.js');
    run('./integration/model-find-mapsto.js');
    run('./integration/model-find.js');
    run('./integration/model-find.callback.js');
    run('./integration/model-get.js');
    run('./integration/model-get.callback.js');
    run('./integration/model-keys.js');
    run('./integration/model-one.js');
    run('./integration/model-one.callback.js');
    run('./integration/model-remove.js');
    run('./integration/model-remove.callback.js');
    run('./integration/model-save.js');
    run('./integration/model-save.callback.js');
    run('./integration/model-sync.js');
    run('./integration/model-sync.callback.js');

    run('./integration/predefined-validators.js');

    run('./integration/property-custom.js');
    run('./integration/property-lazyload.js');
    run('./integration/property-lazyload.callback.js');
    run('./integration/property-maps-to.js');
    run('./integration/property.js');

    run('./integration/settings.js');

    run('./integration/smart-types.js');

    run('./integration/validation.js');

    run('./integration/date-type.js');

    run('./integration/orm-helpers.js');
    
    run('./integration/plugin.js');

    test.run(console.DEBUG);
}

t();
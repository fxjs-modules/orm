#!/usr/local/bin/fibjs

var test = require("test");
test.setup();

function t() {
    run('./integration/orm-exports.js');
    run('./integration/orm-operator.js');
    run('./integration/orm-parseHQL.js');

    run('./integration/utils-linked-list.js');

    run('./integration/model-property.js');
    run('./integration/model-apis.js');

    /* these cases are used for check if internal processing `filterWhereToKnexActionsInternal` correct */
    run('./integration/model-walkConditions.js');
    run('./integration/model-queryByHQL.js');

    // run('./integration/model-aggregate.js');
    run('./integration/model-clear.js');
    run('./integration/model-count.js');
    run('./integration/model-create.js');
    run('./integration/model-exists.js');
    // run('./integration/model-find-chain.js');
    run('./integration/model-find-mapsto.js');
    run('./integration/model-find-advanced.js');
    run('./integration/model-find.js');
    run('./integration/model-get.js');
    run('./integration/model-keys.js');
    run('./integration/model-one.js');
    run('./integration/model-remove.js');
    run('./integration/model-save.js');
    run('./integration/model-sync.js');

    // // run('./integration/predefined-validators.js');

    // // run('./integration/property-custom.js');
    // // run('./integration/property-lazyload.js');
    // // run('./integration/property-maps-to.js');
    // // run('./integration/property.js');

    // // run('./integration/settings.js');

    // // run('./integration/smart-types.js');

    // // run('./integration/validation.js');

    // // run('./integration/date-type.js');

    // // run('./integration/helpers.js');

    // run('./integration/association-o2m.js');
    run('./integration/association-belongsToMany.js');
    // // run('./integration/association-extend.js');

    // run('./integration/association-hasone.js');
    // run('./integration/association-hasone-required.js');
    // run('./integration/association-hasone-reverse.js');
    // run('./integration/association-hasone-zeroid.js');

    // run('./integration/association-hasManyExclusively.js');

    run('./integration/association-hasmany.js');
    // run('./integration/association-hasmany-extra.js');
    // run('./integration/association-hasmany-hooks.js');
    // run('./integration/association-hasmany-mapsto.js');
    // run('./integration/event.js');

    // run('./integration/hook.js');
    // run('./integration/hook-ref.js');
    // run('./integration/association-hook.js');

    run('./integration/instance.js');
    run('./integration/instance-changes-track.js');

    run('./integration/benchmark.js');

    test.run(console.DEBUG);
}

t();

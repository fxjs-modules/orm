import FxDbDriver = require('@fxjs/db-driver');

export function validProtocol () {
    return function (
        target: any, // ORM
        // propertyKey: string,
        // descriptor: PropertyDescriptor
    ) {
        // console.log('target.driver.config', target.driver.config);
        if (!target.driver)
            throw new Error(`driver hasn't been initialized`)

        if (!(target.driver instanceof FxDbDriver))
            throw new Error(`bad initialization of driver`)

        if (
            ![
                'mysql:',
                'sqlite:',
                'mongo:',
                'redis:',
            ].includes(target.driver.config.protocol) 
        )
            throw new Error(`Connection protocol not supported - have you installed the database driver for '${target.driver.config.protocol}'?`)
    };
}
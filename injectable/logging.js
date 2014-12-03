'use strict';

module.exports = function logging(log4js, options) {

    var config = options.log.config || {
        appenders: [
            { type: 'console' }
        ],
        levels: {
            '[all]': options.log.level
        },
        replaceConsole: options.log.replaceConsole === true,
    };

    var opts = {
        reloadSecs: options.log.refresh
    };

    log4js.configure(config, opts);

    var log = log4js.getLogger('microservice-crutch.logging');
    log.debug('Configured log4js; config:', config, '\n opts:', opts);

    return log4js;
};

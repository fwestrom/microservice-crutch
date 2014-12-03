'use strict';

module.exports = function microservices(_, app, inject, logging, options, url, util, when, whenFn) {
    var log = logging.getLogger('microservice-crutch.microservices');
    log.debug('Initializing medseek-util-microservices module; options:', options);

    return inject.resolve('medseek-util-microservices')
        .then(function(ms) {
            return ms(options);
        })
        .then(function(ms) {
            app.on('shutdown', function() {
                log.debug('Shutting down medseek-util-microservices module.');
                ms.dispose();
            });
            ms.on('error', function(error) {
                log.error('Unexpected error:', error);
            });
            return ms.useTransport(ms.AmqpTransport, options)
                .delay(10)
                .yield(ms);
        })
        .then(function(ms) {
            var bindings = {};
            return _.defaults({
                bindings: bindings,
                bind: function(rk, action, opts) {
                    bindings[rk] = action;
                    return ms.bind(rk, action, opts);
                },
            }, ms);
        });
};

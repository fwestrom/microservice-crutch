'use strict';

var _ = require('lodash');
var events = require('events');
var logging = require('log4js');
var medseekUtilMicroservices =require('medseek-util-microservices');
var minimist = require('minimist');
var util = require('util');
var when = require('when');

var injector = require('./injectable/injector.js');

module.exports = function crutch(defaultOptions, callback) {
    if (!(callback instanceof Function) && defaultOptions instanceof Function) {
        var tmp = callback;
        callback = defaultOptions;
        defaultOptions = callback;
    }
    if (callback === undefined) {
        throw new Error('A callback initializing the micro-service is required.');
    }

    var inject = injector({
        app: new events.EventEmitter(),
        defaultOptions: defaultOptions,
        'medseek-util-microservices': medseekUtilMicroservices
    });
    return inject(function(_, app, inject, logging, options) {
        _.extend(app, {
            when: {
                shutdown: when.promise(function(resolve) { app.on('shutdown', resolve); }),
            },
            shutdown: _.partial(inject, shutdown)
        });

        var log = logging.getLogger('microservices-crutch');
        log.info('Started process; pid: %s, options:', process.pid, options);

        return when(app)
            .then(function() {
                return inject(initialize);
            })
            .then(function() {
                return inject(callback);
            })
            .then(function() {
                return inject(function(microservices) {
                    log.debug('crutch: microservices.bindings:', microservices.bindings);
                    _.extend(app, microservices.bindings);
                });
            })
            .then(function() {
                log.info('Ready.');
                return when.call(app.emit, 'ready');
            })
            .yield(app);
    });
};

function initialize(app, inject, logging, options) {
    var log = logging.getLogger('microservices-crutch');
    log.debug('Initializing crutch.');

    log.debug('Setting up signal/exit handlers:', options.shutdownOn);

    options.shutdownOn.forEach(function(signal) {
        log.trace('Setting up handler for signal:', signal);

        process.on(signal, signalHandler);
        app.on('shutdown', shutdownHandler);

        function signalHandler() {
            log.warn('Received signal:', signal);
            app.shutdown()
                .delay(10)
                .tap(function() {
                    process.exit();
                })
                .done();
        }

        function shutdownHandler() {
            process.removeListener(signal, signalHandler);
            app.removeListener('shutdown', shutdownHandler);
        }
    });

    return when.try(inject, function(microservices) {
        log.trace('Initialized microservices module:', microservices);
    });
}

function shutdown(app, logging) {
    var log = logging.getLogger('microservices-crutch');
    log.info('Shutting down.');

    return when.call(app.emit, 'shutdown');
}

// When started directly
if (require.main === module) {
    module.exports({}, function(app, inject, logging) {
        var log = logging.getLogger('module.main');
        log.debug('in module.main');
        app.once('shutdown', function(info) {
            log.debug('module.main shutdown:');
        });
        app.once('exit', function(info) {
            log.debug('module.main exit:', info);
        });

        setTimeout(function() {
            app.shutdown().done();
        }, 5000);
    });
}

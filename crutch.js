'use strict';

var _ = require('lodash');
var events = require('events');
var medseekUtilMicroservices = require('medseek-util-microservices');
var when = require('when');

var injector = require('./injectable/injector.js');

module.exports = crutch;

function crutch(defaultOptions, callback) {
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

    return inject(function(app, inject, logging, options) {
        var log = logging.getLogger('crutch');
        log.info('Started process; pid: %s, options:', process.pid, options);

        _.extend(app, {
            when: {
                ready: when.promise(function(resolve) { app.on('ready', resolve); }),
                shutdown: when.promise(function(resolve) { app.on('shutdown', resolve); }),
            },
            shutdown: shutdown,
        });

        return when(app)
            .then(initialize)
            .then(function() {
                return inject(callback);
            })
            .then(function() {
                return inject(function(microservices) {
                    log.debug('microservices.bindings:', microservices.bindings);
                    _.extend(app, microservices.bindings);
                });
            })
            .then(function ready() {
                log.info('Ready.');
                return when.call(app.emit, 'ready');
            })
            .yield(app);

        function initialize() {
            log.debug('Initializing.');

            return when()
                .then(function() {
                    return inject(function(microservices) {
                        log.trace('Initialized microservices module:', microservices);
                    });
                })
                .then(function() {
                    log.debug('Setting up signal handlers:', options.shutdownOn);
                    _.forEach(options.shutdownOn, function(signal) {
                        log.trace('Setting up signal handler:', signal);

                        var signalHandler = onSignal(signal);
                        process.on(signal, signalHandler);

                        var shutdownHandler = onShutdownForSignal(signal, signalHandler);
                        app.once('shutdown', shutdownHandler);
                    });
                });

            function onShutdownForSignal(signal, signalHandler) {
                return function() {
                    log.trace('onShutdownForSignal| signal: %s', signal);
                    process.removeListener(signal, signalHandler);
                };
            }

            function onSignal(signal) {
                return function() {
                    log.warn('Received signal:', signal);
                    shutdown()
                        //.delay(5)
                        .finally(function() {
                            process.exit();
                        })
                        .done();
                };
            }
        }

        function shutdown() {
            log.info('Shutting down.');
            return when.call(app.emit, 'shutdown')
                .then(function() {
                    return inject(function(microservices) {
                        return microservices.dispose();
                    });
                });
        }
    });

};

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

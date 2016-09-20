var crutch = require('../crutch.js');
var defaults = {
    // medseek-util-microservices options
    defaultExchange: 'topic://example',
    defaultQueue: 'ping-sender',
    defaultReturnBody: true, // false returns message-context from .call/etc
    qServer: 'tcp://127.0.0.1',
    qPort: 3000,
    // microservice-crutch options
    'log.level': 'ERROR',
    reqRes:"req",
    // custom options
    //   override on command line like
    //     --pingValue=MYPING
    pingValue: 'PING',
};

crutch(defaults, function(app, logging, microservices, options, Promise) {
    var log = logging.getLogger('ping-sender');
    log.setLevel('INFO');

    // return a promise that is resolved when your application is ready
    return Promise
        .delay(100)
        .then(function() {
            var body = {
                value: options.pingValue,
            };
            var properties = {
                'sent-by': 'ping-sender',
            };
            microservices.call(options.qServer+":"+options.qPort,JSON.stringify( body), properties)
                .then(function(reply) {
                    log.info('Got reply:', reply);
                })
                .finally(app.shutdown)
                .done();
        });
});

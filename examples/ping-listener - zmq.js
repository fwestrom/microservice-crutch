var crutch = require('../crutch.js');
var defaults = {
    defaultExchange: 'topic://example',
    defaultQueue: 'ping-listener',
    qServer: 'tcp://127.0.0.1',
    qPort: 3000,
    reqRes:"rep",
    defaultReturnBody: false,
    'log.level': 'ERROR',
    pongValue: 'PONG',
};

crutch(defaults, function(logging, microservices, options, Promise) {
    var log = logging.getLogger('ping-listener');
    log.setLevel('INFO');

    return microservices.bind(options.qServer+":"+options.qPort, function(mc) {
        return Promise
            .try(function() {
                var body = mc.deserialize();
                log.info('Got ping:', body);
                log.trace('messageContext:', mc);
                return {
                    value: options.pongValue,
                };
            })
        });
});

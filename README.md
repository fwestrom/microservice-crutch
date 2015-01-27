# microservice-crutch

Provides a jump-start on implementing a micro-service compatible with
micro-services using AMQP and the medseek-util-microservices module.

## Prerequisites

You must have RabbitMQ installed and working.  You can pass the location of
the RabbitMQ server on the command line when starting your process like this:
```bash
node myapp.js --broker=amqp://username:password@host:port/vhost
```

If you do not specify the location of RabbitMQ, the default of
amqp://guest:guest@localhost:5672/ is used instead.


## Usage

### Quick Start

```bash
npm install microservice-crutch
```

```node
var crutch = require('microservice-crutch');
crutch({ /*default options*/ }, function(app, microservices, options, Promise) {
    return microservices.bind('topic://exchangeName/routingKey/queueName', function(mc) {
        return Promise.try(function() {
            return { receivedBody: mc.deserialize() };
        }).catch(function(error) {
            return { error: error };
        });
    });
});
```

### Examples

See the examples for a ping sender and listener that illustrates the most
common usage.

First, clone the Github repository for microservice-crutch, and npm install.

Start the ping listener first, then the ping sender.

```bash
git clone https://github.com/fwestrom/microservice-crutch.git
cd microservice-crutch
npm install
node examples/ping-listener.js
node examples/ping-sender.js
```

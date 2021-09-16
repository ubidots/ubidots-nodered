module.exports = function (RED) {
  var mqtt = require('mqtt');
  var fs = require('fs');
  var path = require('path');

  function UbidotsNode(config) {
    RED.nodes.createNode(this, config);
    var self = this;
    var ENDPOINT_URLS = {
      business: 'industrial.api.ubidots.com',
      educational: 'things.ubidots.com'
    };
    var useTLS = config.tls_checkbox;
    var URL_PREFIX = 'mqtt://';

    var port = 1883;
    var portTLS = 8883;
    var certificate = fs.readFileSync(
      path.join(__dirname, '../keys/certificate.pem'),
      'utf8',
      function () { }
    );
    
    // Gets flow context and sets the status of the Node to be available at the flow level
    var flowContext = self.context().flow;
    flowContext.set("_ubidotsOutStatus", null);

    var endpointUrl = ENDPOINT_URLS[config.tier] || ENDPOINT_URLS.business;
    var token = config.token;
    var client = mqtt.connect(URL_PREFIX + endpointUrl, {
      username: token,
      password: '',
      port: useTLS ? portTLS : port,
      cert: useTLS ? certificate : undefined,
      protocol: useTLS ? 'mqtts' : 'mqtt'
    });

    client.on('reconnect', function () {
      flowContext.set("_ubidotsOutStatus", false);
      self.status({fill: 'yellow',shape: 'ring', text: 'Reconnecting'});
    });

    client.on('connect', function (connack) {
      flowContext.set("_ubidotsOutStatus", true);
      self.status({ fill: 'green', shape: 'dot', text: 'Connected'});
    });
    client.on('disconnect', function (packet) {
      flowContext.set("_ubidotsOutStatus", false);
      self.status({ fill: 'red', shape: 'ring', text: 'Disconnected'});
    });

    client.on('error', function (msg) {
      flowContext.set("_ubidotsOutStatus", false);
      self.status({fill: 'red', shape: 'ring', text: 'Error connecting'});
    });

    self.on('input', function (msg, send, done) {
      //In case the msg contains a property named'ubidotsDeviceLabel'
      //it will be taken as device_label, otherwise it takes it from the device_label field
      var device_label = msg.payload.ubidotsDeviceLabel || config.device_label;
      if (device_label === undefined || device_label === '') {
        console.error(
          "Device_Label is not defined. The device_label field is probably empty or you didn't include the key 'ubidotsDeviceLabel' in your JSON."
        );
      } else {
        if (msg.payload.ubidotsDeviceLabel) {
          delete msg.payload.ubidotsDeviceLabel;
        }
        var values =
          typeof msg.payload !== 'object' || msg.payload === null
            ? {}
            : msg.payload;

        if (typeof values === 'object') {
          values = JSON.stringify(values);
        }
        client.publish(
          '/v1.6/devices/' + device_label,
          values,
          { qos: 1, retain: false },
          function () {
            console.log('Published successfully,');
          }
        );
      }
      if (done) {
        done();
      }
    });

    self.on('close', function () {
      if (client !== null && client !== undefined) {
        client.end(true);
      }
    });
  }

  RED.nodes.registerType('ubidots_out', UbidotsNode);
};

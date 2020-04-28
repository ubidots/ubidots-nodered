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
      function () {}
    );

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
      self.status({
        fill: 'yellow',
        shape: 'ring',
        text: 'ubidots.reconnecting'
      });
    });

    client.on('connect', function (connack) {
      console.log('Ubidots Publisher connected');
      self.status({ fill: 'green', shape: 'dot', text: 'Connected' });
    });
    client.on('disconnect', function (packet) {
      console.log('Publisher disconnected');
      self.status({ fill: 'red', shape: 'ring', text: 'Disconnected' });
    });

    client.on('error', function (msg) {
      console.warn('Publisher: Inside error function, msg: ', msg);
      self.status({
        fill: 'red',
        shape: 'ring',
        text: 'ubidots.error_connecting'
      });
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
        try {
          client.publish(
            '/v1.6/devices/' + device_label,
            values,
            { qos: 1, retain: false },
            function () {
              console.log('Published successfully,');
            }
          );
        } catch (e) {
          console.log('Published failed: ', e);
        }
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType('ubidots_out', UbidotsNode);
};

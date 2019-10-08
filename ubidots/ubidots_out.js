module.exports = function (RED) {
  var mqtt = require('mqtt')

  function postUbidots (self, endpointUrl, labelDevice, values, token) {
    var client = mqtt.connect('mqtt://' + endpointUrl, { username: token, password: '' })

    client.on('connect', function () {
      client.publish(
        '/v1.6/devices/' + labelDevice,
        values,
        { qos: 1, retain: false },
        function () {
          client.end(true)
        }
      )
      self.status({ fill: 'green', shape: 'dot', text: 'ubidots.published' })
    })

    client.on('error', function (msg) {
      self.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' })
    })
  }

  function UbidotsNode (n) {
    RED.nodes.createNode(this, n)
    var self = this

    var ENDPOINT_URLS = {
      business: 'industrial.api.ubidots.com',
      educational: 'things.ubidots.com'
    }

    this.on('input', function (msg) {
      var labelDevice = (msg.device_label || n.device_label) || (msg.label_device || n.label_device)
      var endpointUrl = ENDPOINT_URLS[n.tier] || ENDPOINT_URLS.business
      var values = (typeof msg.payload !== 'object' || msg.payload === null) ? {} : msg.payload
      var token = msg.token || n.token

      if (typeof (values) === 'object') {
        values = JSON.stringify(values)
      }

      self.status({ fill: 'green', shape: 'ring', text: 'ubidots.connecting' })
      postUbidots(self, endpointUrl, labelDevice, values, token)
    })
  }

  RED.nodes.registerType('ubidots_out', UbidotsNode)
}

module.exports = function (RED) {
  var mqtt = require('mqtt')

  function getClient (self, endpointUrl, labelDevice, labelVariable, token) {
    self.status({ fill: 'green', shape: 'ring', text: 'ubidots.connecting' })

    if (this.client !== null && this.client !== undefined) {
      this.client.end(true, function () {})
    }

    var client = mqtt.connect('mqtt://' + endpointUrl, { username: token, password: '' })
    this.client = client

    client.on('error', function () {
      client.end(true, function () {})
      self.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' })
    })

    client.on('close', function () {
      client.end(true, function () {})
    })

    client.on('reconnect', function () {
      var topic = '/v1.6/devices/' + labelDevice + '/' + labelVariable
      var options = {}

      self.status({ fill: 'green', shape: 'dot', text: 'ubidots.connected' })
      options[topic] = 1

      client.subscribe(options, function () {
        try {
          client.on('message', function (topic, message, packet) {
            self.emit('input', { payload: JSON.parse(message.toString()) })
          })
        } catch (e) {
          self.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' })
        }
      })
    })

    client.on('connect', function () {
      var topic = '/v1.6/devices/' + labelDevice + '/' + labelVariable
      var options = {}

      self.status({ fill: 'green', shape: 'dot', text: 'ubidots.connected' })
      options[topic] = 1

      client.subscribe(options, function () {
        try {
          client.on('message', function (topic, message, packet) {
            self.emit('input', { payload: JSON.parse(message.toString()) })
          })
        } catch (e) {
          self.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' })
        }
      })
    })
  }

  function UbidotsNode (n) {
    RED.nodes.createNode(this, n)
    var self = this

    var ENDPOINTS_URLS = {
      business: 'industrial.api.ubidots.com',
      educational: 'things.ubidots.com'
    }

    var labelDevice = n.device_label || n.label_device
    var labelVariable = n.label_variable
    var endpointUrl = ENDPOINTS_URLS[n.tier] || ENDPOINTS_URLS.business
    var token = n.token

    getClient(self, endpointUrl, labelDevice, labelVariable, token)

    this.on('error', function () {
      if (self.client !== null && self.client !== undefined) {
        self.client.end(true, function () {})
      }
      self.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' })
    })

    this.on('close', function () {
      if (self.client !== null && self.client !== undefined) {
        self.client.end(true, function () {})
      }
    })

    this.on('input', function (msg) {
      try {
        this.send(msg)
      } catch (err) {
        this.error(err, msg)
      }
    })
  }

  RED.nodes.registerType('ubidots_in', UbidotsNode)
}

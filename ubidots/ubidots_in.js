module.exports = function (RED) {
  var mqtt = require('mqtt')

  function getClient (self, endpoint_url, label_device, label_variable, token) {
    self.status({ fill: 'green', shape: 'ring', text: 'ubidots.connecting' })

    if (this.client !== null && this.client !== undefined) {
      this.client.end(true, function () {})
    }

    var client = mqtt.connect('mqtt://' + endpoint_url, { username: token, password: '' })
    this.client = client

    client.on('error', function () {
      client.end(true, function () {})
      self.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' })
    })

    client.on('close', function () {
      client.end(true, function () {})
    })

    client.on('reconnect', function () {
      var topic = '/v1.6/devices/' + label_device + '/' + label_variable
      var options = {}

      self.status({ fill: 'green', shape: 'dot', text: 'ubidots.connected' })
      options[topic] = 1

      client.subscribe(options, function (err, granted) {
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
      var topic = '/v1.6/devices/' + label_device + '/' + label_variable
      var options = {}

      self.status({ fill: 'green', shape: 'dot', text: 'ubidots.connected' })
      options[topic] = 1

      client.subscribe(options, function (err, granted) {
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

    var endpoint_urls = {
      business: 'industrial.api.ubidots.com',
      educational: 'things.ubidots.com'
    }

    var label_device = n.device_label || n.label_device
    var label_variable = n.label_variable
    var endpoint_url = endpoint_urls[n.tier] || endpoint_urls.business
    var token = n.token

    getClient(self, endpoint_url, label_device, label_variable, token)

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

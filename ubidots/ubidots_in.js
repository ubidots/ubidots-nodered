module.exports = function(RED) {
  var mqtt = require("mqtt");

  function getClient(self, endpointUrl, labelDevice, labelVariable, token) {
    self.status({ fill: "green", shape: "ring", text: "ubidots.connecting" });

   /*  var tlsClient = mqtt.connect("mqtts://" + endpointUrl, {
      username: token,
      password: ""
    }); */
    var client = mqtt.connect("mqtt://" + endpointUrl, {
      username: token,
      password: ""
    });

    client.on("error", function() {
      client.end(true, function() {});
      self.status({
        fill: "red",
        shape: "ring",
        text: "ubidots.error_connecting"
      });
    });

    client.on("close", function() {
      client.end(true, function() {});
    });

    client.on("reconnect", function() {
      console.log("Client reconnecting");
      var topic = "/v1.6/devices/" + labelDevice + "/" + labelVariable;
      var options = {};

      self.status({
        fill: "yellow",
        shape: "ring",
        text: "ubidots.connecting"
      });
      options[topic] = 1;

      client.subscribe(options, function() {
        try {
          client.on("message", function(topic, message, packet) {
            self.emit("input", { payload: JSON.parse(message.toString()) });
          });
        } catch (e) {
          self.status({
            fill: "red",
            shape: "ring",
            text: "ubidots.error_connecting"
          });
        }
      });
    });

    client.on("connect", function() {
      console.log("Client connected");
      var topic = "/v1.6/devices/" + labelDevice + "/" + labelVariable;
      var options = {};

      self.status({ fill: "green", shape: "dot", text: "ubidots.connected" });
      options[topic] = 1;

      client.subscribe(options, function() {
        try {
          client.on("message", function(topic, message, packet) {
            self.emit("input", { payload: JSON.parse(message.toString()) });
          });
        } catch (e) {
          self.status({
            fill: "red",
            shape: "ring",
            text: "ubidots.error_connecting"
          });
        }
      });
    });
  }

  function UbidotsNode(config) {
    RED.nodes.createNode(this, config);
    console.log("Ubidots_in CONFIG: ", config);
    var self = this;
    var ENDPOINTS_URLS = {
      business: "industrial.api.ubidots.com",
      educational: "things.ubidots.com"
    };

    var labelDevice = config.device_label;
    var labelVariable = config["label-variable-1"];
    var endpointUrl = ENDPOINTS_URLS[config.tier] || ENDPOINTS_URLS.business;
    var token = config.token;
    var variable2 = config["label-variable-2"];
    console.log("Variable 2", variable2);

    getClient(self, endpointUrl, labelDevice, labelVariable, token);

    this.on("error", function() {
      if (self.client !== null && self.client !== undefined) {
        self.client.end(true, function() {});
      }
      self.status({
        fill: "red",
        shape: "ring",
        text: "ubidots.error_connecting"
      });
    });

    this.on("close", function() {
      if (self.client !== null && self.client !== undefined) {
        self.client.end(true, function() {});
      }
    });

    this.on("input", function(msg, send, done) {
      try {
        send(msg);
      } catch (err) {
        this.error(err, msg);
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType("ubidots_in", UbidotsNode);
};

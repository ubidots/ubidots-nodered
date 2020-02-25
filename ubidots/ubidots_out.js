module.exports = function(RED) {
  var mqtt = require("mqtt");
  // require("events").EventEmitter.prototype._maxListeners = Infinity;

  function UbidotsNode(config) {
    RED.nodes.createNode(this, config);
    var self = this;
    var ENDPOINT_URLS = {
      business: "industrial.api.ubidots.com",
      educational: "things.ubidots.com"
    };
    var endpointUrl = ENDPOINT_URLS[config.tier] || ENDPOINT_URLS.business;
    var token = config.token;
    var client = mqtt.connect("mqtt://" + endpointUrl, {
      username: token,
      password: "",
      keepAlive: 60,
      clean: true,
      reschedulePings: true,
      connectTimeout: 30000,
      reconnectPeriod: 1000
    });

    client.on("reconnect", function() {
      console.log("Publisher Reconnecting");
      self.status({
        fill: "yellow",
        shape: "ring",
        text: "ubidots.reconnecting"
      });
    });

    client.on("connect", function(connack) {
      console.log("Publisher Connected");
      self.status({ fill: "green", shape: "dot", text: "Connected" });
    });
    client.on("disconnect", function(packet) {
      console.log("Publisher disconnected");
      self.status({ fill: "red", shape: "ring", text: "Disconnected" });
    });

    client.on("error", function(msg) {
      console.warn("Inside error function, msg: ", msg);
      self.status({
        fill: "red",
        shape: "ring",
        text: "ubidots.error_connecting"
      });
    });

    self.on("input", function(msg, send, done) {
      var device_label = msg.device_label || config.device_label;
      var values =
        typeof msg.payload !== "object" || msg.payload === null
          ? {}
          : msg.payload;

      if (typeof values === "object") {
        values = JSON.stringify(values);
      }
      console.log("Message: ", values);

      try {
        client.publish(
          "/v1.6/devices/" + device_label,
          values,
          { qos: 1, retain: false },
          function() {
            console.log("Published successfully,");
          }
        );
      } catch (e) {
        console.log("Published failed: ", e);
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType("ubidots_out", UbidotsNode);
};

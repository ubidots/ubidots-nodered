module.exports = function(RED) {
  var mqtt = require("mqtt");
  var fs = require("fs");
  var path = require("path");

  function getClient(self, useTLS, endpointUrl, labelDevice, labelVariable, token) {
    self.status({ fill: "green", shape: "ring", text: "ubidots.connecting" });

    console.log("Client useTLS", useTLS);
    var URL_PREFIX = "mqtt://";
    var port = 1883;
    var portTLS = 8883;
    var certificate = fs.readFileSync(
      path.join(__dirname, "./certificate.pem"),
      "utf8",
      function() {}
    );
  console.log("Client certificate: ", certificate);
  console.log("Client port: ", useTLS ? portTLS : port,);
  console.log("Client cert: ",useTLS ? certificate : undefined);
  console.log("Client protocolo: ", useTLS ? "mqtts" : "mqtt");

    var client = mqtt.connect(URL_PREFIX + endpointUrl, {
      username: token,
      password: "",
      port: useTLS ? portTLS : port,
      cert: useTLS ? certificate : undefined,
      protocol: useTLS ? "mqtts" : "mqtt",

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
      // console.log("Client, topic: ", topic);
      // console.log("Client, options: ", options);
      self.status({ fill: "green", shape: "dot", text: "ubidots.connected" });
      options[topic] = 1;

      client.subscribe(options, function() {
        try {
          client.on("message", function(topic, message, packet) {
            console.log("Message ", message.toString());
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
    var useTLS = config.tls_checkbox_in;
    console.log("useTLS ", useTLS);

    var labelDevice = config.device_label;
    var labelVariable = config["label_variable_1"];
    var endpointUrl = ENDPOINTS_URLS[config.tier] || ENDPOINTS_URLS.business;
    var token = config.token;

    getClient(self, useTLS, endpointUrl, labelDevice, labelVariable, token);

    this.on("error", function(msg) {
      console.log("Client: Inside error function", msg);
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

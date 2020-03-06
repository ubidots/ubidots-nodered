module.exports = function(RED) {
  var mqtt = require("mqtt");
  var fs = require("fs");
  var path = require("path");

  function getClient(
    self,
    topics,
    useTLS,
    endpointUrl,
    labelDevice,
    labelVariable,
    token
  ) {
    self.status({ fill: "green", shape: "ring", text: "ubidots.connecting" });
    var URL_PREFIX = "mqtt://";
    var port = 1883;
    var portTLS = 8883;
    var certificate = fs.readFileSync(
      path.join(__dirname, "./certificate.pem"),
      "utf8",
      function() {}
    );

    var client = mqtt.connect(URL_PREFIX + endpointUrl, {
      username: token,
      password: "",
      port: useTLS ? portTLS : port,
      cert: useTLS ? certificate : undefined,
      protocol: useTLS ? "mqtts" : "mqtt"
    });

    client.on("error", function() {
      console.log("client inside client error function");
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
      var options = { qos: 1 };
      self.status({
        fill: "yellow",
        shape: "ring",
        text: "ubidots.connecting"
      });

      client.subscribe(topics, options, function() {
        try {
          client.on("message", function(topic, message, packet) {
            console.log("Client sending message:", message);
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
      var options = { qos: 1 };

      self.status({ fill: "green", shape: "dot", text: "ubidots.connected" });
      client.subscribe(topics, options, function(err, granted) {
        console.log("Client subscribe, granted", granted);
        try {
          client.on("message", function(topic, message, packet) {
            console.log("topic: ", topic);
            var shortTopic = topic.substring(14);
            var finalMessage = {};
            finalMessage[shortTopic] = JSON.parse(message.toString());
            console.log("finalMessage Object:", finalMessage);
            // self.emit("input", { payload: JSON.parse(message.toString()) });
            self.emit("input", { payload: finalMessage });
          });
        } catch (e) {
          console.log("Error when trying to emit: ", e);
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

    var topics = {};
    topics = getSubscribePaths(config);

    getClient(
      self,
      topics,
      useTLS,
      endpointUrl,
      labelDevice,
      labelVariable,
      token
    );

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
      //console.log("Inside Client Send Method", msg);

      try {
        send(msg);
      } catch (err) {
        console.log("Error in client when sending data to debug node,", err);
        this.error(err, msg);
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType("ubidots_in", UbidotsNode);
};

function getSubscribePaths(config) {
  var paths = [];
  var labelString = "label_variable_";
  var completeLabelString = "";
  var checkboxString = "checkbox_variable_";
  var checkboxString2 = "_last_value";
  var completeCheckboxString = "";
  //use customtopics
  if (config.custom_topic_checkbox) {
    console.log("USE custom topics");
    for (var i = 1; i < 11; i++) {
      completeLabelString = labelString + i.toString();
      console.log("custom topic labelString: ", completeLabelString);
      if (!(config[completeLabelString] === "")) {
        paths.push("/v1.6/devices/" + config[completeLabelString]);
      }
    }
  } else {
    console.log("NO custom topics");
    for (var i = 1; i < 11; i++) {
      completeLabelString = labelString + i.toString();
      completeCheckboxString = checkboxString + i.toString() + checkboxString2;
      if (!(config[completeLabelString] === "")) {
        //last Value is true
        //if last value checkbox is checked

        if (config[completeCheckboxString]) {
          console.log("Last Value CHECKED");
          paths.push(
            "/v1.6/devices/" +
              config.device_label +
              "/" +
              config[completeLabelString] +
              "/lv"
          );
        } else {
          paths.push(
            "/v1.6/devices/" +
              config.device_label +
              "/" +
              config[completeLabelString]
          );
        }
      }
    }
  }
  console.log("Inside getSubscribePaths, paths", paths);
  return paths;
}

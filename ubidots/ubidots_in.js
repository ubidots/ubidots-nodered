function defineOutputObject(topic, message, useCustomTopics = false) {
  let finalObject = {};
  let variable = topic;
  if (useCustomTopics) {
    variable = topic.substring(14);
    finalObject = parseOutputObject(topic, variable, message);
  } else {
    if (topic.endsWith('/lv')) {
      variable = topic.slice(0, topic.length - 3);
    }
    let topicElements = variable.split('/');
    variable = topicElements[topicElements.length - 1];
    finalObject = parseOutputObject(topic, variable, message);
  }
  return finalObject;
}

function parseOutputObject(topic, variable, message) {
  let finalObject = {};
  if (topic.endsWith('/lv')) {
    finalObject[variable] = { value: JSON.parse(message.toString()) };
  } else {
    finalObject[variable] = JSON.parse(message.toString());
  }
  return finalObject;
}

function getSubscribePaths(config) {
  var paths = [];
  var labelString = 'label_variable_';
  var completeLabelString = '';
  var checkboxString = 'checkbox_variable_';
  var checkboxString2 = '_last_value';
  var completeCheckboxString = '';
  //use customtopics
  if (config.custom_topic_checkbox) {
    for (var i = 1; i < 11; i++) {
      completeLabelString = labelString + i.toString();
      if (!(config[completeLabelString] === '')) {
        paths.push('/v1.6/devices/' + config[completeLabelString]);
      }
    }
  } else {
    for (var i = 1; i < 11; i++) {
      completeLabelString = labelString + i.toString();
      completeCheckboxString = checkboxString + i.toString() + checkboxString2;
      if (!(config[completeLabelString] === '')) {
        //if last value checkbox is checked
        var devicePath =
          '/v1.6/devices/' +
          config.device_label +
          '/' +
          config[completeLabelString];
        if (config[completeCheckboxString]) {
          devicePath += '/lv';
        }
        paths.push(devicePath);
      }
    }
  }
  return paths;
}

module.exports = function (RED) {
  var mqtt = require('mqtt');
  var fs = require('fs');
  var path = require('path');

  function UbidotsNode(config) {
    RED.nodes.createNode(this, config);
    var ENDPOINTS_URLS = {
      business: 'industrial.api.ubidots.com',
      educational: 'things.ubidots.com'
    };
    var useTLS = config.tls_checkbox_in;
    var endpointUrl = ENDPOINTS_URLS[config.tier] || ENDPOINTS_URLS.business;
    var token = config.token;
    var useCustomTopics = config.custom_topic_checkbox;

    var URL_PREFIX = 'mqtt://';
    var port = 1883;
    var portTLS = 8883;
    var certificate = fs.readFileSync(
      path.join(__dirname, '../keys/certificate.pem'),
      'utf8',
      function () { }
    );

    var topics = {};
    topics = getSubscribePaths(config);

    this.status({ fill: 'green', shape: 'ring', text: 'ubidots.connecting' });

    var client = mqtt.connect(URL_PREFIX + endpointUrl, {
      username: token,
      password: '',
      port: useTLS ? portTLS : port,
      cert: useTLS ? certificate : undefined,
      protocol: useTLS ? 'mqtts' : 'mqtt',
      reconnectPeriod: 10000
    });

    client.on('connect', () => {
      this.status({ fill: 'green', shape: 'dot', text: 'Connected' });
      var options = { qos: 1 };
      client.subscribe(topics, options);
    });

    client.on("message", (topic, message) => {
      let finalObject = defineOutputObject(topic, message, useCustomTopics);
      try {
        this.emit("input", { payload: finalObject });
      } catch (e) {
        console.log("Error when trying to emit: ", e);
        this.status({
          fill: "red", shape: "ring", text: "smithtek.error_connecting",
        });
      }
    });

    client.on("close", () => {
      console.log("I'm on close");
      this.status({ fill: "red", shape: "ring", text: "Disconnected" });
      client.unsubscribe(topics);
    });

    client.on("error", (error) => {
      console.log("I'm on error");
      this.status({ fill: "red", shape: "ring", text: "Disconnected" });
      client.unsubscribe(topics);
    });

    client.on("reconnect", () => {
      this.status({ fill: "green", shape: "ring", text: "Reconnecting" });
    });

    this.on('error', (msg) => {
      console.log('Client: Inside error function', msg);
      if (client !== null && client !== undefined) {
        client.end(true);
      }
      this.status({ fill: 'red', shape: 'ring', text: 'ubidots.error_connecting' });
    });

    this.on('close', () => {
      if (client !== null && client !== undefined) {
        client.end(true);
      }
    });

    this.on('input', (msg, send, done) => {
      try {
        send(msg);
      } catch (err) {
        console.log('Error in client when sending data to debug node,', err);
        this.error(err, msg);
      }
      if (done) {
        done();
      }
    });
  }

  RED.nodes.registerType('ubidots_in', UbidotsNode);
};

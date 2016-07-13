module.exports = function (RED) {
  var mqtt = require('mqtt');
  function getClient(that, n){
    if(that.client !== null && that.client !== undefined){
      that.client.end(true, function(){});
    }
    var client = mqtt.connect('mqtt://things.ubidots.com', {username: n.token, password: ""});
    that.client = client;
    client.on("error", function () {
      client.end(true, function(){});
      that.status({fill: "red", shape: "ring", text: "disconnected"});
    });
    client.on('close', function(){
      client.end(true, function(){});
    });
    client.on("reconnect", function () {
      that.status({fill: "green", shape: "dot", text: "connected"});
      var topic = "/v1.6/devices/" + n.label_data_source + "/" + n.label_variable;
      var options = {};
      options[topic] = 1;
      client.subscribe(options, function (err, granted) {
        try {
          client.on('message', function (topic, message, packet) {
            that.emit("input", {payload: JSON.parse(message.toString())});
          });
        } catch (e) {
          that.status({fill: "red", shape: "ring", text: "disconnected"});
        }
      });
    });
    client.on("connect", function () {
      that.status({fill: "green", shape: "dot", text: "connected"});
      var topic = "/v1.6/devices/" + n.label_data_source + "/" + n.label_variable;
      var options = {};
      options[topic] = 1;
      client.subscribe(options, function (err, granted) {
        try {
          client.on('message', function (topic, message, packet) {
            that.emit("input", {payload: JSON.parse(message.toString())});
          });
        } catch (e) {
          that.status({fill: "red", shape: "ring", text: "disconnected"});
        }
      });
    });
  }
  function UbidotsNode(n) {
    RED.nodes.createNode(this, n);
    var that = this;
    getClient(that, n);
    that.status({fill: "red", shape: "ring", text: "disconnected"});
    
    this.on("error", function () {
      if(that.client !== null && that.client !== undefined){
	that.client.end(true, function(){});
      }
      that.status({fill: "red", shape: "ring", text: "disconnected"});
    });
    this.on("close", function(){
      if(that.client !== null && that.client !== undefined){
	that.client.end(true, function(){});
      }
    });
    this.on("input", function (msg) {
      try {
        this.send(msg);
      } catch (err) {
        this.error(err, msg);
      }
    });
  }
  RED.nodes.registerType("ubidots_in", UbidotsNode);
};

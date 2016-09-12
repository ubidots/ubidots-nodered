/* global callback */

module.exports = function (RED) {
    var mqtt = require("mqtt");
    var request = require('request');
    var translateUrl = 'http://things.ubidots.com/api/v1.6/devices/';
    function postUbidots(label_data_source, values, token, protocol) {
        if (protocol === 'mqtt') {
            var client = mqtt.connect('mqtt://things.ubidots.com', {username: token, password: ""});
            client.on("connect", function () {
                client.publish("/v1.6/devices/" + label_data_source + "", values, {'qos': 1, 'retain': false},
                        function (error, response) {
                            client.end(true, function () {
                            });
                        });
            });
        } else if (protocol === 'http') {
            var uri = encodeURI(translateUrl + label_data_source + '?token=' + token);
            var options = {
                method: 'POST',
                uri: uri,
                body: values,
                headers: {
                    'content-type': 'application/json',
                    'X-Auth-Token': token
                }
            };
            request.post(options, function (error, response, body) {

            });
        }
    }

    function UbidotsNode(n) {
        RED.nodes.createNode(this, n);
        this.on("input", function (msg) {
            var label_data_source = msg.label_data_source || n.label_data_source;
            var protocol = msg.protocol || n.protocol || 'mqtt';
            var values = msg.payload;
            if (typeof (values) === 'object') {
                values = JSON.stringify(values);
            }
            var token = msg.token || n.token;
            postUbidots(label_data_source, values, token, protocol);
        });
    }
    RED.nodes.registerType("ubidots_out", UbidotsNode);
};

/* global callback */

module.exports = function (RED) {
    var mqtt = require("mqtt");

    function postUbidots(self, endpoint_url, label_device, values, token) {
        var client = mqtt.connect('mqtt://' + endpoint_url, {username: token, password: ""});

        client.on("connect", function () {
            client.publish(
                "/v1.6/devices/" + label_device + "",
                values,
                {'qos': 1, 'retain': false},
                function (error, response) {
                    client.end(true, function () {});
                }
            );
            self.status({ fill: "green", shape: "dot", text: "ubidots.published" });
        });

        client.on('error', function (msg) {
            self.status({ fill: "red", shape: "ring", text: "ubidots.error_connecting" });
        });
    }

    function UbidotsNode(n) {
        RED.nodes.createNode(this, n);
        var self = this;

        var endpoint_urls = {
            business: 'industrial.api.ubidots.com',
            educational: 'things.ubidots.com'
        };

        this.on("input", function (msg) {
            var label_device = (msg.device_label || n.device_label) || (msg.label_device || n.label_device);
            var endpoint_url = endpoint_urls[n.tier] || endpoint_urls['business'];
            var values = msg.payload;
            var token = msg.token || n.token;

            if (typeof (values) === 'object') {
                values = JSON.stringify(values);
            }

            self.status({ fill: "green", shape: "ring", text: "ubidots.connecting" });
            postUbidots(self, endpoint_url, label_device, values, token);
        });
    }

    RED.nodes.registerType("ubidots_out", UbidotsNode);
};

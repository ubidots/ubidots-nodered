module.exports = function (RED) {
    var mqtt = require("mqtt");
    function postUbidots(label_data_source, values, token) {
        var client = mqtt.connect('mqtt://things.ubidots.com', {username: token, password: ""});
        client.on("connect", function () {
            client.publish("/v1.6/devices/" + label_data_source + "", values, {'qos': 1, 'retain': false},
                    function (error, response) {
                        client.end(true, function () {
                        });
                    });
        });
    }

    function UbidotsNode(n) {
        RED.nodes.createNode(this, n);
        this.on("input", function (msg) {
            var label_data_source = msg.label_data_source || n.label_data_source;
            var values = msg.payload;
		if(typeof(values) === 'object'){
				values = JSON.stringify(values);
			}
            var token = msg.token || n.token;
            postUbidots(label_data_source, values, token);
        });
    }
    RED.nodes.registerType("ubidots_out", UbidotsNode);
};

module.exports = function (RED) {
    var mqtt = require('mqtt');
	function getClient(x, n){
		if(x.client !== null && x.client !== undefined){
			x.client.end(true, function(){});
		}
		try {
            var client = mqtt.connect('mqtt://things.ubidots.com', {username: n.token, password: ""});
			x.client = client;
            client.on("error", function () {
				client.end(true, function(){});
                x.status({fill: "red", shape: "ring", text: "disconnected"});
            });
			client.on('close', function(){
				client.end(true, function(){});
			});
            client.on("reconnect", function () {
                x.status({fill: "green", shape: "dot", text: "connected"});
                var topic = "/v1.6/devices/" + n.label_data_source + "/" + n.label_variable;
                var options = {};
                options[topic] = 1;
                client.subscribe(options, function (err, granted) {
                    try {
                        client.on('message', function (topic, message, packet) {
                            x.emit("input", {payload: JSON.parse(message.toString())});
                        });
                    } catch (e) {
                        x.status({fill: "red", shape: "ring", text: "disconnected"});
                    }
                });
            });
            client.on("connect", function () {
                x.status({fill: "green", shape: "dot", text: "connected"});
                var topic = "/v1.6/devices/" + n.label_data_source + "/" + n.label_variable;
                var options = {};
                options[topic] = 1;
                client.subscribe(options, function (err, granted) {
                    try {
                        client.on('message', function (topic, message, packet) {
                            x.emit("input", {payload: JSON.parse(message.toString())});
                        });
                    } catch (e) {
                        x.status({fill: "red", shape: "ring", text: "disconnected"});
                    }
                });
            });
        } catch (e) {
            x.status({fill: "red", shape: "ring", text: "disconnected"});
        }	
	}
    function UbidotsNode(n) {
        RED.nodes.createNode(this, n);
        var x = this;
		getClient(x, n);
        x.status({fill: "red", shape: "ring", text: "disconnected"});
        
        this.on("error", function () {
			if(x.client !== null && x.client !== undefined){
				x.client.end(true, function(){});
			}
            x.status({fill: "red", shape: "ring", text: "disconnected"});
        });
		this.on("close", function(){
			if(x.client !== null && x.client !== undefined){
				x.client.end(true, function(){});
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

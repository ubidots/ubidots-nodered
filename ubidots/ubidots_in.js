module.exports = function(RED) {
	var mqtt = require('mqtt');

    function UbidotsNode(n) {
        RED.nodes.createNode(this, n);
	var x = this;
        var client  = mqtt.connect('mqtt://things.ubidots.com', {username:'NRmyIOPJGkmXOc0Ah93PA2SylvNysZ', password:""});
	var topic = "/v1.6/devices/"+n.label_data_source+"/"+n.label_variable;
	var options = {};
	options[topic] = 1;
	client.subscribe(options, function(err, granted) {
		client.on('message', function(topic, message, packet) {
			x.emit("input", {payload: JSON.parse(message.toString())});			
		});	
	});
  	this.on("input",function(msg) {
            try {
                this.send(msg);
            } catch(err) {
                this.error(err,msg);
            }
        });
    }
	RED.nodes.registerType("ubidots_in", UbidotsNode);
};

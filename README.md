# Node-RED Ubidots Node

This [Node-RED](http://nodered.org) node is used to interact with the Ubidots service. It publishes and suscribes to one or multiple variables. It also provides the ability to subscribe to up to 10 Ubidots custom topics.

[Ubidots](https://ubidots.com) is a platform to help you power your IoT and Cloud applications.

## Requirements

Requires a node-red version of >1.0.

## Installation

The `ubidots-nodered` node for Node-RED is available as an [npm package](https://www.npmjs.com/package/ubidots-nodered). We recommend you to read [Node-RED documentation](https://nodered.org/docs/getting-started/adding-nodes.html#installing-npm-packaged-nodes), if you have any doubts installing nodes in the platform.

## Usage

There are two different nodes: One for subscribing (reading) information from Ubidots and another one for publishing (sending) information to Ubidots.

### Ubidots In

This node (Subscriber) is used to suscribe to one or more (up to 10) Ubidots [Variable(s)](http://help.ubidots.com/faqs-and-troubleshooting/what-are-variables) or custom topics. It will listen to new values and pass it to further nodes in the `msg.payload`.

The node uses the [MQTT](https://github.com/mqttjs/MQTT.j) library to establish the connection and suscribe to the variable or topic.

Double click on the node to configure all the required fields.

*  __Account type:__ Defaults to “Ubidots”, which is valid for both Industrial and STEM account type. If you have a STEM account, choose “Ubidots for Education”

*  __Name:__ The Label of the node in the Node-Red workspace. If empty, defaults to: "Ubidots in". This library uses an MQTT implementation, hence, it's neccesary to name this MQTT client. We recommend you to choose a non-easy-to-copy name, to prevent cases where the name crashes between different clients in the broker.

*  __Token__: The Token necessary to authenticate the connection to your Ubidots account. To obtain your token, login on [ubidots.com](https://www.ubidots.com), under "My Profile" click on "API Credentials". ([Tutorial](https://help.ubidots.com/en/articles/590078-find-your-token-from-your-ubidots-account))

*  __Device label__: The label of the Device to which the node subscribes. Please keep in mind that this field is neglected in case custom topics are used.

*  __TLS__: By default, all data is sent encrypted via TLS. Uncheck if data should be sent unencrypted.

*  __Use Custom Topics__: Allows to specify up to 10 custom topics to which the node subscribes to. The topic starts after `/v1.6/devices/`.

A topic has to be in the following format: `Device_Label/Variable_Label`. Optionally `/lv` can be added to subscribe to the Last Value only. Topics support wildcard characters: "+" for single level and "#" for multi level.

*  __Variable label__: The name of the Variable the node subscribes to.

*  __Last Value__: By default, the node subscribes to the *Last Value* of the variable. Uncheck to subscribe to the complete data point object.

*  __Add Variable/Add Topic__: Adds an additional variable/topic (up to 10).

When using custom topics, the output is a JSON object with the *topic* as key and the *Last Value*/data point object as value, e.g.: `{"device_label/variable": {"value": 100, "timestamp": 1583523586668, "context": { "key1": "value1", "key2": "value2"}, "created_at": 1583523586732}`

When using the variable name (with the device label), the output is a JSON object with the *variable name* as key and the *Last Value*/data point object as value, e.g.: `{"variable": {"value": 100, "timestamp": 1583523586668, "context": { "key1": "value1", "key2": "value2"}, "created_at": 1583523586732}`

Refer to the [Ubidots Documentation](https://ubidots.com/docs/api/mqtt.html) for more information about the functionality of the MQTT broker.

If you get the error: `TypeError: send is not a function`, please run `npm update node-red` and reload Node-Red. You probably run a `0.x` node-red version. This library requires >`1.0`.

### Ubidots Out

This node is used to publish to an Ubidots [Variable](http://help.ubidots.com/faqs-and-troubleshooting/what-are-variables). It will receive a value from a previous node and publish it to your variable on Ubidots.

These are the properties you should configure, by double clicking the node:

*  __Account type:__ Defaults to “Ubidots”, which is valid for both Industrial and STEM account type. If you have a STEM account, choose “Ubidots for Education”

*  __Name:__ Label of node in Node-Red workspace. If empty, defaults to: "Ubidots out". This library uses an MQTT implementation, hence, it's neccesary to name this MQTT client. We recommend you to choose a non-easy-to-copy name, to prevent cases where the name crashes between different clients in the broker.

*  __Token__: The Token necessary to authenticate the connection to your account. To obtain your token, login on [ubidots.com](https://www.ubidots.com), under "My Profile" click on "API Credentials". [Tutorial](https://help.ubidots.com/en/articles/590078-find-your-token-from-your-ubidots-account)

*  __Device label__  _or_  __msg.payload.ubidotsDeviceLabel__: The label of the Device to which the data will be published. If no Device exists with this label on Ubidots, it will be automatically created. Can be sent dynamically in the message JSON object with the key: `ubidotsDeviceLabel`. If no Device label is sent in the message, it defaults back to the value from the Device Label field. Keep in mind that the Device Label is required.

*  __TLS__: By default all data is sent encrypted via TLS. Uncheck if data should be sent unencrypted.

*  __msg.payload:__ The payload will contain all the values that are sent to the Device. It's structured to use the key of the object as the variable label and the value of the key as the value to send to Ubidots, e.g. `{"variable-label": 42}`

The message can contain the following properties:

- `msg.payload.ubidotsDeviceLabel` (optional) - The label of the Device to which the packet will be published. If no Device Label is sent, it takes the Device Label from the *Device Label* field in the node settings.

- `msg.payload` (optional) - The values to be published on the given Device. Each key is the label of the variable.

Example of a simple value JSON message:`{"variable": 100}`.

Example of a JSON message providing context data: `{"variable": {"value": 200, "context": {"key1": "value1","key2": "value2"}}}`.

Example of JSON message with multiple variables: `{"variable_1": {"value": 100, "context": {"key1": "value1", "key2": "value2"}}, "variable_2": {"value": 200, "context": { "key1": "value1", "key2": "value2"}}}`.

Refer to the [Ubidots Documentation](https://ubidots.com/docs/api/mqtt.html) for more information about the functionality of the MQTT broker.

## Authentication
  
The authentication is made by using the __Token__ field in your nodes. You can read more about authenticating with Ubidots and MQTT in [our documentation](https://ubidots.com/docs/api/mqtt.html#authentication).

## Development

If you want to modify this extension, you just have to run `npm install` or `yarn install` to fetch and install the dependencies.

To install the development version and use it on your Node-RED instance, you can execute `npm link` on this folder and then execute

`npm link ubidots-nodered` in your `~/.nodered` folder.

More information in the section: [Testing your node in Node-RED](https://nodered.org/docs/creating-nodes/first-node]).

## License

This software is provided under the MIT license. See [LICENSE](LICENSE) for applicable terms.
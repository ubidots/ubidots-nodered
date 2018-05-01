# Node-RED Ubidots Node

This is a [Node-RED](http://nodered.org) node used to interact with the Ubidots service. It publishes and suscribes to one or multiple variables.

[Ubidots](https://ubidots.com) is a platform to help you power your IoT and Cloud applications.

## Installation

The `ubidots-nodered` node for Node-RED is available as an [npm package](https://www.npmjs.com/package/ubidots-nodered). We recommend
you to read [Node-RED documentation](https://nodered.org/docs/getting-started/adding-nodes.html#installing-npm-packaged-nodes) if you
have any doubts installing nodes in the platform.

## Usage

There are two different nodes: One for reading information from Ubidots and another one for sending information to Ubidots.

### Ubidots In

This node is used to suscribe to an Ubidots [Variable](http://help.ubidots.com/faqs-and-troubleshooting/what-are-variables). It will
listen to new values and pass it to further nodes in the `msg.payload`.

These are the properties you should configure, by double clicking the node:

* __Account type:__ The type of your account, wheter it is an Ubidots for Business account or an Ubidots for Educational account.

* __Name:__ This library uses an MQTT implementation, hence, it's neccesary to name this MQTT client. We recommend you choose a
non-easy-to-copy name, to prevent cases where the name crashes between different clients in the broker.

* __Token__: This is your account token. You may find information on how to obtain this token in the [following link](http://help.ubidots.com/user-guides/find-your-token-from-your-ubidots-account)

* __Device label__: The label of the [Device](http://help.ubidots.com/user-guides/ubidots-basics-devices-variables-dashboards-and-alerts) that contains the Variable from which you want to obtain the data.

* __Variable label__: The label of the Variable to which you will suscribe.

### Ubidots Out

This node is used to publish to an Ubidots [Variable](http://help.ubidots.com/faqs-and-troubleshooting/what-are-variables). It will
receive a value from a previous node and publish it to your Variable.

These are the properties you should configure, by double clicking the node:

* __Account type:__ The type of your account, wheter it is an Ubidots for Business account or an Ubidots for Educational account.

* __Name:__ This library uses an MQTT implementation, hence, it's neccesary to name this MQTT client. We recommend you choose a
non-easy-to-copy name, to prevent cases where the name crashes between different clients in the broker.

* __Token__ _or_ __msg.token__: This is your account token. You may find information on how to obtain this token in the [following link](http://help.ubidots.com/user-guides/find-your-token-from-your-ubidots-account)

* __Device label__ _or_ __msg.label_device__: The label of the [Device](http://help.ubidots.com/user-guides/ubidots-basics-devices-variables-dashboards-and-alerts) to which you want to send the data.

* __msg.payload:__ This payload will contain all the values that will be sent to the Device. It's structured to use the key of the
object as the Variable label and the value of the key as the value to send to Ubidots, e.g. `{"variable-label": 42}`

## Authentication

The authentication is made by using the __Token__ field in your nodes. You can read more about authenticating with Ubidots and MQTT in [our documentation](https://ubidots.com/docs/api/mqtt.html#authentication).

## Development

If you want to modify this extension, you just have to run `npm install` or `yarn install` to fetch and install the dependencies.

To install the development version and use it on your Node-RED instance, you can execute `npm link` on this folder and then execute
`npm link ubidots-nodered` in your `~/.nodered` folder.

## License

This software is provided under the MIT license. See [LICENSE](LICENSE) for applicable terms.

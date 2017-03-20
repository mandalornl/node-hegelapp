## HegelApp

Webapplication to access ip-control features of the Hegel Röst.

It uses a proxy server to connect to the Hegel Röst which allows for multiple connections.

## Configuration

Be sure to configure the ip address to use your Hegel device in the config file.
Create `localcfg.js` and place in the `/config` folder.

**Example**
```javascript
module.exports = {
	device: {
		host: '192.168.x.x'
	}
};
```

## Installation

Use the following command to install the necessary packages.
```bash
$ npm install
```

To start the `express` server, just run:
```bash
$ grunt prod
```

## Usage 

Depending on the `configuration` settings the proxy can be accessed using:

```bash
$ telnet localhost 3001
```

And the webserver can be accessed via:
```text
http://localhost:3000/
```

A `dummy` device can be used for easier testing purposes, so you can keep listening to your music undisturbed. It will listen on `localhost:50001` and can be started with:
```bash
$ node device
```

Be sure to run it before the `express` server starts and make sure you change the ip address in the `config` file accordingly.
## HegelApp

Webapplication to access ip-control features of the Hegel Röst.

It uses a proxy server to connect to the Hegel Röst which allows for multiple connections.

## Configuration

Be sure to configure the ip address to use your Hegel device in the config file.
Create `config.js` and place it in the `/config/local` folder.

**Example**
```javascript
module.exports = {
  device: {
    host: '192.168.x.x'
  }
};
```

## Presets

Presets can be defined to use your preferred settings i.e. for listening to music or watching movies. 
Just create a `presets.json` file and place it in the `/config/local` folder.

**Example**
```json
[{
  "name": "Music",
  "cmds": {
    "input": 4,
    "volume": 30
  }
}]
```

## Installation

Use the following command to install the necessary `npm` packages.
```bash
$ npm install
```

To start the `express` server, install `bower` packages, minify `css` and uglify `js`,  just run:
```bash
$ grunt production
```

Or just simply run:
```bash
$ node app
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

## Disclaimer

This app is in no way affiliated with, authorized, maintained, sponsored or endorsed by Hegel or any of its affiliates or subsidiaries.

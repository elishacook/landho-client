# landho-client

This is a client for [landho](https://github.com/elishacook/landho) services exposed via a web socket.

## Install

```bash
npm install --save landho-client
```

## Usage

```js
var landho_client = require('landho-client'),
    WebSocket = require('ws')

var socket = new WebSocket('http://0.0.0.0:5000')
socket.on('connect', function ()
{
    var client = landho_client(socket),
        foo = client.service('foo')
    
    // Calling a request/response method
    foo('add', { a: 1, b: 72 }, function (err, result)
    {
        console.log(result) // -> 73
    })
    
    // Calling a method that returns a channel
    foo('counter', { start: 100 }, function (err, channel)
    {
        // `result` contains the initial value
        console.log(result) // -> 100
        
        // Listen to events emitted by the channel
        channel.on('update', function (c)
        {
            console.log(c) // -> 101...102...103...
        })
        
        // When you don't want updates anymore, close the channel
        setTimeout(function ()
        {
            channel.close()
        }, 5000)
    })
})
```

See `tests/index.js` for a complete, working example that includes a server component.
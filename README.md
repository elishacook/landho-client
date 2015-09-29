# Land Ho!! Socket.IO client

This is a client for [landho](https://github.com/elishacook/landho) services exposed via a Socket.IO server.

## Install

```bash
npm install --save landho-client
```

## Usage

```js
var landho_client = require('landho-client'),
    io_client = require('socket.io-client')

var socket = io_client.connect('http://0.0.0.0:5000', { transports: ['websocket'] })
socket.on('connect', function ()
{
    var client = landho_client(socket),
        foo = client.service('foo')
    
    // Calling a request/response method
    foo('add', { a: 1, b: 72 }, function (err, result)
    {
        console.log(result) // -> 73
    })
    
    // Calling a feed method
    foo('counter', { start: 100 }, function (err, result, feed)
    {
        // `result` contains the initial value
        console.log(result) // -> 100
        
        // Listen to events emitted by the feed
        feed.on('update', function (c)
        {
            console.log(c) // -> 101...102...103...
        })
        
        // When you don't want updates anymore, close the feed
        setTimeout(function ()
        {
            feed.close()
        }, 5000)
    })
})
```

See `tests/index.js` for a complete, working example that includes a server component.
'use strict'

var EventEmitter = require('tiny-eventemitter'),
    inherits = require('inherits')


var ServiceClient = function (socket, options)
{
    EventEmitter.call(this)
    var options = options || {}
    this.socket = socket
    this.serialize = options.serialize || JSON.stringify
    this.unserialize = options.unserialize || JSON.parse
    
    var counter = 0
    this.id = function () { return (++counter + '') }
    
    this.feeds = {}
    
    this.socket.onerror = this.handle_error.bind(this)
    this.socket.onmessage = this.handle_message.bind(this)
}
inherits(ServiceClient, EventEmitter)


ServiceClient.prototype.call = function (name, data, done)
{
    var message_id = this.id(),
        feed = this.create_feed(message_id, done)
    
    this.socket.send(
        this.serialize(
        {
            id: message_id,
            name: name,
            data: { data: data }
        })
    )
}

ServiceClient.prototype.create_feed = function (message_id, done)
{
    var feed = new EventEmitter()
    this.feeds[message_id] = feed
    
    feed.on('initial', function (result)
    {
        done(null, result, feed)
    })
    
    feed.close = function ()
    {
        this.socket.send(
            this.serialize(
            {
                id: message_id,
                name: 'close'
            })
        )
    }.bind(this)
}

ServiceClient.prototype.handle_error = function (error)
{
    console.error(error)
    this.emit('error', error)
}

ServiceClient.prototype.handle_message = function (event)
{
    var message = this.unserialize(event.data)
    
    var feed = this.feeds[message.id]
    
    if (feed)
    {
        feed.emit(message.name, message.data)
    }
    else
    {
        if (message.id)
        {
            this.handle_error({ code: 500, message: 'No feed found with an ID#'+message.id })
        }
        else if (message.name == 'error')
        {
            this.handle_error(message.data)
        }
        else
        {
            this.handle_error({ code: 500, message: 'Invalid message from server', raw_message: raw_message })
        }
    }
}

module.exports = function (socket, options)
{
    var service = new ServiceClient(socket, options)
    return service.call.bind(service)
}
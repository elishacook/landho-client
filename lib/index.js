'use strict'

var SimpleEvents = require('@elishacook/simple-events'),
    Channel = require('./channel')


module.exports = LandhoClient


function LandhoClient (socket, options)
{
    SimpleEvents.mixin(this)
    var options = options || {}
    this.socket = socket
    this.serialize = options.serialize || JSON.stringify
    this.unserialize = options.unserialize || JSON.parse
    this.callbacks = {}
    this.channels = {}
    this.Promise = options.Promise || Promise
    
    var counter = 0
    this.id = function () { return (++counter + '') }
    
    this.socket.onerror = this.handle_error.bind(this)
    this.socket.onmessage = this.handle_message.bind(this)
}


LandhoClient.prototype.service = function (name)
{
    return this.call.bind(this, name)
}


LandhoClient.prototype.call = function (name, method, data, done)
{
    this.emit('call_start')
    
    var run = function (done)
    {
        var message_id = this.id()
        this.callbacks[message_id] = done
        
        this.socket.send(
            this.serialize(
            {
                id: message_id,
                name: name+' '+method,
                data: { data: data }
            })
        )
    }.bind(this)
    
    if (done)
    {
        run(function (err, res)
        {
            this.emit('call_end')
            done(err, res)
        }.bind(this))
    }
    else
    {
        return new this.Promise(function (resolve, reject)
        {
            run(function (err, result)
            {
                this.emit('call_end')
                if (err)
                {
                    reject(err)
                }
                else
                {
                    resolve(result)
                }
            }.bind(this))
        }.bind(this))
    }
}


LandhoClient.prototype.handle_message = function (event)
{
    var message = this.unserialize(event.data)
    
    if (message.name == 'channel')
    {
        var channel = this.channels[message.id]
        
        if (!channel)
        {
            return
        }
        
        channel.emit(message.data.name, message.data.data)
    }
    else if (message.name == 'result' || message.name == 'error')
    {
        var done = this.callbacks[message.id]
        
        if (!done)
        {
            this.handle_error(new Error('Received a result message without a matching callback.'))
            return
        }
        
        delete this.callbacks[message.id]
        
        if (message.name == 'error')
        {
            done(message.data)
        }
        else if (message.data.data)
        {
            done(null, message.data.data)
        }
        else if (message.data.channel)
        {
            var channel = new Channel(message.data.channel)
            channel.end.all(this.send_channel_message.bind(this, channel))
            this.channels[channel.id] = channel
            done(null, channel.end)
        }
    }
    else
    {
        this.handle_error(new Error('Unknown message type "'+message.name+'"'))
    }
}


LandhoClient.prototype.send_channel_message = function (channel, name, data)
{
    this.socket.send(this.serialize(
    {
        id: channel.id,
        name: 'channel',
        data:
        {
            name: name,
            data: data
        }
    }))
    
    if (name == 'close')
    {
        delete this.channels[channel.id]
    }
}


LandhoClient.prototype.handle_error = function (error)
{
    console.error(error.stack)
    this.emit('error', error)
}
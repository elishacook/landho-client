'use strict'

var Client = function (socket)
{
    this.socket = socket
}

Client.prototype.service = function (name)
{
    var service = new ServiceClient(name, this.socket)
    return service.call.bind(service)
}

var ServiceClient = function (name, socket)
{
    this.name = name
    this.socket = socket
}

ServiceClient.prototype.call = function (name, data, callback)
{
    this.socket.emit(this.name+' '+name, { data: data }, function (err, feed_id)
    {
        if (err)
        {
            callback(err)
        }
        else
        {
            this.socket.on(feed_id+' initial', function (result)
            {
                callback(null, result, {
                    on: function (event, handler)
                    {
                        this.socket.on(feed_id+' '+event, handler)
                    }.bind(this),
                    close: function ()
                    {
                        this.socket.emit(feed_id+' close')
                    }.bind(this)
                })
            }.bind(this))
        }
    }.bind(this))
}

module.exports = function (socket)
{
    return new Client(socket)
}
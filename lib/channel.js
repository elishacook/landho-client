'use strict'

var SimpleEvents = require('@elishacook/simple-events')

module.exports = function (id)
{
    var left = new SimpleEvents(),
        right = new SimpleEvents()
        
    return {
        id: id,
        on: left.on.bind(left),
        emit: right.emit.bind(right),
        end: {
            on: right.on.bind(right),
            emit: left.emit.bind(left),
            all: left.all.bind(left),
            close: function ()
            {
                left.emit('close')
            }
        }
    }
}
'use strict'

var SimpleEvents = require('@elishacook/simple-events')

module.exports = Channel

function Channel (id, left, right)
{
    this.id = id
    
    if (!left)
    {
        left = new SimpleEvents()
        right = new SimpleEvents
        this.end = new Channel(this.id, right, left)
    }
    else
    {
        this.close = function ()
        {
            left.emit('close')
        }
        
        this.all = left.all.bind(left)
    }
    
    this.on = left.on.bind(left)
    this.emit = right.emit.bind(right)
}
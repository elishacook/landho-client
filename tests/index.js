'use strict'

var chai = require('chai')
chai.config.includeStack = true
global.expect = chai.expect

var PORT = 5151,
    URL = 'http://0.0.0.0:'+PORT,
    ws = require('ws'),
    wss = new ws.Server({ port: PORT }),
    landho = require('landho'),
    LandhoClient = require('../lib'),
    api = landho(),
    Channel = require('../lib/channel')
   
landho.socket(api, wss)

api
    .service('calc',
    {
        wrong: function (params, done)
        {
            done({ message: 'wrong' })
        },
        
        add: function (params, done)
        {
            done(null, params.data.a + params.data.b)
        },
        
        counter: function (params, done)
        {
            var counter = 0,
                interval = null,
                channel = new landho.Channel()
            
            channel.on('close', function ()
            {
                clearInterval(interval)
            })
            
            interval = setInterval(function ()
            {
                channel.emit('update', ++counter)
            }, 1)
            
            done(null, channel)
        }
    })
    
var get_client = function (done)
{
    var socket = new ws(URL)
    socket.on('open', function ()
    {
        done(new LandhoClient(socket))
    })
}
    
describe('Client', function ()
{
    it('can call a method', function (done)
    {
        get_client(function (client)
        {
            client.service('calc')('add', { a: 4, b: 3 }, function (err, result)
            {
                expect(err).to.be.null
                expect(result).to.equal(7)
                done()
            })
        })
    })
    
    it('can call a method that returns a channel', function (done)
    {
        get_client(function (client)
        {
            client.service('calc')('counter', {}, function (err, channel)
            {
                expect(err).to.be.null
                expect(channel).to.be.instanceof(Channel)
                
                var expect_c = 1
                channel.on('update', function (c)
                {
                    expect(c).to.equal(expect_c)
                    expect_c++
                    
                    if (expect_c == 3)
                    {
                        // We have to leave some time for 
                        // update events in the pipe to arrive
                        // before we check to see if the feed
                        // has stopped
                        channel.close()
                        done()
                        expect(client.channels[channel.id]).to.be.undefined
                    }
                })
            })
        })
    })
})
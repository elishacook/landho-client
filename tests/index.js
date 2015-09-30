'use strict'

var chai = require('chai')
chai.config.includeStack = true
global.expect = chai.expect

var PORT = 5151,
    URL = 'http://0.0.0.0:'+PORT,
    OPTIONS = {
        transports: ['websocket'],
        'force new connection': true
    },
    io = require('socket.io').listen(PORT),
    io_client = require('socket.io-client'),
    landho = require('landho'),
    landho_client = require('../lib'),
    api = landho()
    
api
    .configure(landho.socket(io))
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
        
        counter: function (params)
        {
            var counter = 0
                
            return {
                initial: function (done)
                {
                    done(null, counter)
                },
                changes: function (subscriber, done)
                {
                    var interval = setInterval(function ()
                    {
                        subscriber.emit('update', ++counter)
                    }, 1)
                    
                    done(null, { close: clearInterval.bind(null, interval) })
                }
            }
        }
    })
    
var get_client = function (done)
{
    var socket = io_client.connect(URL, OPTIONS)
    socket.on('connect', function ()
    {
        done(landho_client(socket))
    })
}
    
describe('Client', function ()
{
    it('can call a request/response method', function (done)
    {
        get_client(function (client)
        {
            var calc = client.service('calc')
            calc('add', { a: 4, b: 3 }, function (err, result, feed)
            {
                expect(err).to.be.null
                expect(result).to.equal(7)
                done()
            })
        })
    })
    
    it('can call a feed method', function (done)
    {
        get_client(function (client)
        {
            var calc = client.service('calc')
            calc('counter', {}, function (err, initial, feed)
            {
                expect(err).to.be.null
                expect(initial).to.equal(0)
                expect(feed).to.not.be.undefined
                expect(feed.on).to.not.be.undefined
                
                var expect_c = 1
                feed.on('update', function (c)
                {
                    expect(c).to.equal(expect_c)
                    expect_c++
                    
                    if (expect_c == 3)
                    {
                        // We have to leave some time for 
                        // update events in the pipe to arrive
                        // before we check to see if the feed
                        // has stopped
                        feed.close()
                        setTimeout(function ()
                        {
                            var orig_expect_c = expect_c
                            setTimeout(function ()
                            {
                                expect(expect_c).to.equal(orig_expect_c)
                                done()
                            }, 50)
                        }, 50)
                    }
                })
            })
        })
    })
})
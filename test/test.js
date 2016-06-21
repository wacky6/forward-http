'use strict'

const forward = require('../')

const createServer = require('http').createServer
const request = require('request')
const strictEqual = require('assert')

describe('http-fowarding', function(){
    let svrSrc, svrFwd

    before(function(next) {
        svrSrc = createServer( (req, res)=>{
            let body = ''
            req.on('data', (d)=>body+=d )
            req.on('end', ()=>{
                let buf = new Buffer(JSON.stringify({
                    url:     req.url,
                    headers: req.headers,
                    message: 'test',
                    body:    body
                }))
                res.statusCode = 200
                res.setHeader('Content-Length', buf.length)
                res.setHeader('Content-Type',   'application/json')
                res.setHeader('X-Extra',        'xxx')
                if (req.url.match(/\/simulate-h2/i))
                    res.setHeader('Connection', 'Close')
                res.end(buf)
            } )
        } ).listen(10000, next)
    })

    before(function(next) {
        svrFwd = createServer( (req, res)=>{
            if (req.url.match(/\/simulate-h2/i))
                res.push = function push(){}
            if (req.url.startsWith('/502'))
                forward('http://localhost:10002'+req.url, req, res)
            else
                forward('http://localhost:10000'+req.url, req, res)
        }).listen(10001, next)
    })

    it('typical get', function(done){
        request.get('http://localhost:10001/file?query=1#hash', (err, res, body)=>{
            let j = JSON.parse(body)
            strictEqual(j.message, 'test', 'should be "test"')
            strictEqual(j.headers['host'], 'localhost:10000', 'host should set to destination')
            strictEqual(res.headers['x-extra'], 'xxx', 'extra headers returned')
            done()
        })
    })

    it('typical post', function(done){
        request({
            method: 'POST',
            url:    'http://localhost:10001/post?query=1',
            form:   {q:1}
        }, (err, res, body)=>{
            let j = JSON.parse(body)
            strictEqual(j.headers['content-type'], 'application/x-form-urlencoded', 'contnt type')
            strictEqual(j.body, 'q=1', 'form posted')
            done()
        })
    })

    it('return 502 on error', function(done){
        request.get('http://localhost:10001/502', (err, res, body)=>{
            strictEqual(res.statusCode, 502)
            done()
        })
    })

    it('strip legacy http/1.x headers, if res is h2/spdy', function(done){
        request.get('http://localhost:10001/simulate-h2/resp', (err, res, body)=>{
            strictEqual(typeof res.headers.connection, 'undefined')
            done()
        })
    })

    after(function(){
        svrFwd.close()
        svrSrc.close()
    })
})

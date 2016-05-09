'use strict'

const request = require('http').request
const parse = require('url').parse

/* dest: destination url
 * req:  http.IncomingMessage
 * res:  http.ServerResponse
 */
module.exports = function(dest, req, res) {
    let u = parse(dest)
    let opts = {
        method:   req.method,
        protocol: u.protocol,
        hostname: u.hostname,
        port:     u.port,
        path:     u.path,
        headers:  req.headers
    }

    // modify host if present
    if (opts.headers.host)
        opts.headers.host = u.host

    req.pipe(
        request(opts, (_res)=>{
            res.statusCode = _res.statusCode
            for (let i=0; i!=_res.rawHeaders.length; i+=2)
                res.setHeader(_res.rawHeaders[i], _res.rawHeaders[i+1])
            _res.pipe(res)
        })
        .on('error', (err)=>{
            if (res.headersSent) {
                res.end()
            }else{
                res.statusCode = 502
                res.setHeader('X-Error', err.message)
                res.setHeader('X-Code',  err.errno ? err.errno : '-1')
                res.end('502, Bad Gateway')
            }
        })
    )
}

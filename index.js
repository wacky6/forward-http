'use strict'

const request = require('http').request
const parse = require('url').parse

const H2_DEPRECATED_HEADERS = [
    'connection', 'keep-alive',
    'proxy-connection', 'transfer-encoding',
    'upgrade'
]

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
            /* guess spdy/h2, remove deprecated headers
             * refer: https://http2.github.io/http2-spec/
             */
            if (res.spdyStream || res.push instanceof Function)
                H2_DEPRECATED_HEADERS.forEach( header => delete _res.headers[header] )
            for (let header in _res.headers)
                res.setHeader(header, _res.headers[header])
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

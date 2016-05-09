forward-http
===
Forward http request to another destination

## Usage
Useful for forwarding API calls to backends.

```JavaScript
const forward = require('forward-http')
require('http').createServer( (req, res)=>{
    forward('http://destination.url/path?query=1', req, res)
} ).listen(8000)
```

## API
#### `forward(dest, req, res)`
###### dest: destination url
Must use http protocol, forwarding to HTTPS is not supported!  
Can contain query string

###### req/res: http.IncomingMessage/http.ServerResponse
You get these from `http.Server`'s `request` event  
Can be compatible objects (such as `spdy.Server`'s)


## Performance
Not tested yet. :(

## LICENSE
MIT

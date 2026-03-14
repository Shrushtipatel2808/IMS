const http = require('http');

const data = JSON.stringify({
  name: 'Aurora Neal',
  email: 'aurora@invenflow.com',
  password: 'Admin@1234'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log(body));
});

req.on('error', e => console.error(e.message));
req.write(data);
req.end();

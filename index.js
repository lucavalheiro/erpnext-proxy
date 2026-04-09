const https = require('https');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const item = new URL(req.url, 'http://localhost').searchParams.get('item');
  const url = `https://erpcoe.c.erpnext.com/api/resource/Bin?filters=[["item_code","=","${item}"]]&fields=["item_code","warehouse","actual_qty"]`;

  const options = {
    headers: {
      'Authorization': 'token 5eeeb697cabb58b:15a1c848d2a25f1'
    }
  };

  https.get(url, options, (erpRes) => {
    let data = '';
    erpRes.on('data', chunk => data += chunk);
    erpRes.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
  }).on('error', (e) => {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  });
});

server.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));

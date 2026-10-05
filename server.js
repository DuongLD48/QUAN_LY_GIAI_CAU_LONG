const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404: Không tìm thấy file');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🏸 MÁY CHỦ WEB GIẢI CẦU LÔNG 2026 ĐÃ KHỞI CHẠY!`);
  console.log(`👉 Link Người Xem:  http://localhost:${PORT}/index.html`);
  console.log(`👉 Link Quản Trị:  http://localhost:${PORT}/admin.html`);
  console.log(`=================================================`);

  // Tự động mở trình duyệt
  exec(`start http://localhost:${PORT}/index.html`);
});

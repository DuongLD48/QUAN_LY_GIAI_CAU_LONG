const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

try {
  if (fs.existsSync(path.join(__dirname, '.env')) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(path.join(__dirname, '.env'));
  }
} catch (e) {
  console.warn("Không thể tải file .env:", e.message);
}

const PORT = process.env.PORT || 3000;
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

let currentPort = Number(process.env.PORT) || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Cổng ${currentPort} đang bị chiếm dụng. Đang tự động thử cổng ${currentPort + 1}...`);
    currentPort += 1;
    setTimeout(() => {
      startServer(currentPort);
    }, 500);
  } else {
    console.error('Lỗi máy chủ:', err);
  }
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`=================================================`);
    console.log(`🏸 MÁY CHỦ WEB GIẢI CẦU LÔNG 2026 ĐÃ KHỞI CHẠY!`);
    console.log(`👉 Link Người Xem:  http://localhost:${port}/index.html`);
    console.log(`👉 Link Quản Trị:  http://localhost:${port}/admin.html`);
    console.log(`=================================================`);

    // Tự động mở trình duyệt
    exec(`start http://localhost:${port}/index.html`);
  });
}

startServer(currentPort);

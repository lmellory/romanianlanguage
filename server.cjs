const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 let file;try{file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(file.endsWith('/'))file+='index.html';const full=path.resolve(root,'.'+file);
 if(!full.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(full,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);});
}).listen(port,'127.0.0.1',()=>console.log('Vorbește: http://127.0.0.1:'+port));

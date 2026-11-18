import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {localDb} from './local-db.mjs';
execFileSync(process.execPath,['scripts/build.mjs']);
const {default: worker} = await import('../dist/server/index.js');
const DB = localDb('preview.sqlite');
const portArg = process.argv.indexOf('--port');
const port = Number(process.env.PORT || (portArg >= 0 && process.argv[portArg+1]) || 3000);
createServer(async (req,res) => {
  const options = {method:req.method, headers:req.headers};
  if (!['GET','HEAD'].includes(req.method)) {
    options.body = req;
    options.duplex = 'half';
  }
  const origin = (req.headers['x-forwarded-proto'] || 'http') + '://' + req.headers.host;
  const response = await worker.fetch(new Request(new URL(req.url, origin), options),{DB});
  const headers=Object.fromEntries(response.headers);
  const cookies=response.headers.getSetCookie();
  if(cookies.length)headers['set-cookie']=cookies;
  res.writeHead(response.status,headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port,'0.0.0.0');

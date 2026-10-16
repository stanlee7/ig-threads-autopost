// 캐러셀 게시(2~10장). 기본은 컨테이너까지만 만들고 멈춤, --go 를 붙여야 실제로 올린다.
// 실행: node post-carousel.mjs --dir 이미지폴더 --caption 캡션.txt [--go]
// 폴더 안 01.jpg, 02.jpg ... (JPEG만. PNG는 미리 JPEG로 바꿔 두기)
// 인스타 API는 이미지를 「공개 주소」로만 받는다. 그래서 이 PC에서 폴더를 잠깐 띄우고
// Cloudflare 임시 터널(cloudflared, 계정 불필요)로 공개 주소를 만든 뒤 게시가 끝나면 닫는다.
// cloudflared: https://github.com/cloudflare/cloudflared/releases (경로를 .env 의 CLOUDFLARED= 에)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { env, api, arg, GO } from './ig.mjs';

const dir = path.resolve(arg('--dir'));
const caption = fs.readFileSync(path.resolve(arg('--caption')), 'utf8').trim();
const jpgs = fs.readdirSync(dir).filter((f) => /^\d+\.jpe?g$/i.test(f)).sort();
if (jpgs.length < 2 || jpgs.length > 10) throw new Error(`캐러셀은 2~10장: ${jpgs.length}장`);

const server = http.createServer((req, res) => {
  const f = path.join(dir, path.basename(decodeURIComponent(req.url.split('?')[0])));
  if (!/\.jpe?g$/i.test(f) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': fs.statSync(f).size }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const cf = spawn(env.CLOUDFLARED || 'cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${server.address().port}`]);
const base = await new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('터널 주소를 60초 안에 못 받음')), 60000);
  const on = (d) => { const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m) { clearTimeout(t); res(m[0]); } };
  cf.stdout.on('data', on); cf.stderr.on('data', on);
});
const close = () => { try { cf.kill(); } catch {} server.close(); };
process.on('exit', close);
for (let i = 0; i < 30; i++) { try { const r = await fetch(`${base}/${jpgs[0]}`); if (r.ok) break; } catch {} await new Promise((r) => setTimeout(r, 2000)); }

const children = [];
for (const f of jpgs) {
  const c = await api(`${env.IG_USER_ID}/media`, { method: 'POST', params: { image_url: `${base}/${f}`, is_carousel_item: 'true' } });
  children.push(c.id); console.log('카드', f, '준비됨');
}
const box = await api(`${env.IG_USER_ID}/media`, { method: 'POST', params: { media_type: 'CAROUSEL', children: children.join(','), caption } });
for (let i = 0; i < 30; i++) {
  const s = await api(box.id, { params: { fields: 'status_code' } });
  if (s.status_code === 'FINISHED') break;
  if (s.status_code === 'ERROR') throw new Error('캐러셀 처리 오류');
  await new Promise((r) => setTimeout(r, 3000));
}
if (!GO) { console.log(`시험 완료: ${children.length}장 준비됨(게시 안 함). 실제 게시는 --go`); close(); process.exit(0); }
const pub = await api(`${env.IG_USER_ID}/media_publish`, { method: 'POST', params: { creation_id: box.id } });
const m = await api(pub.id, { params: { fields: 'permalink' } });
close(); console.log('게시 완료', m.permalink, '\nMEDIA_ID=' + pub.id); process.exit(0);

// 스레드 글 1개 게시(500자 이하). 기본은 점검만, --go 를 붙여야 올린다.
// 실행: node threads-post.mjs --text 글.txt [--go]
import fs from 'node:fs';
import path from 'node:path';
import { env, arg, GO } from './ig.mjs';

const B = 'https://graph.threads.net/v1.0';
const text = fs.readFileSync(path.resolve(arg('--text')), 'utf8').trim();
console.log(`${text.length}자`);
if (text.length > 500) throw new Error('스레드 500자 초과');
if (!GO) { console.log('점검만 했습니다. 실제 게시는 --go'); process.exit(0); }

const post = async (p, params) => {
  const r = await (await fetch(`${B}/${p}`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: env.THREADS_TOKEN }) })).json();
  if (r.error) throw new Error(`${p}: ${r.error.message}`);
  return r;
};
const c = await post(`${env.THREADS_USER_ID}/threads`, { media_type: 'TEXT', text });
await new Promise(r => setTimeout(r, 5000)); // 만든 뒤 잠깐 기다렸다 게시
const pub = await post(`${env.THREADS_USER_ID}/threads_publish`, { creation_id: c.id });
const info = await (await fetch(`${B}/${pub.id}?fields=permalink&access_token=${env.THREADS_TOKEN}`)).json();
console.log('게시 완료', info.permalink);

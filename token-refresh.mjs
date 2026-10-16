// 단기 사용자 토큰(.env 의 IG_TOKEN)을 장기 토큰으로 바꾸고, 그걸로 만료 없는 페이지 토큰(IG_PAGE_TOKEN)을 받아 .env 에 저장한다.
// 토큰 값은 화면에 출력하지 않는다. 권한과 유효 여부만 보여 준다.
// 순서: Graph API 탐색기(developers.facebook.com/tools/explorer)에서 아래 권한으로 토큰을 만들어
//       .env 의 IG_TOKEN= 뒤에 붙여넣기 → node token-refresh.mjs
import fs from 'node:fs';
import path from 'node:path';
import { env, G, HERE } from './ig.mjs';

const get = async (u) => { const j = await (await fetch(u)).json(); if (j.error) throw new Error(j.error.message); return j; };
const need = ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments', 'instagram_manage_messages', 'instagram_manage_insights', 'pages_show_list', 'pages_read_engagement'];

if (!env.IG_TOKEN) { console.log('.env 의 IG_TOKEN 이 비어 있습니다.'); process.exit(1); }
const appTok = encodeURIComponent(`${env.IG_APP_ID}|${env.IG_APP_SECRET}`);
const long = await get(`${G}/oauth/access_token?grant_type=fb_exchange_token&client_id=${env.IG_APP_ID}&client_secret=${env.IG_APP_SECRET}&fb_exchange_token=${encodeURIComponent(env.IG_TOKEN)}`);
const pages = await get(`${G}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(long.access_token)}`);
const page = (pages.data || []).find((p) => p.id === env.IG_PAGE_ID);
if (!page) { console.log('IG_PAGE_ID 와 같은 페이지가 없습니다. 탐색기의 페이지 선택에서 그 페이지를 체크했는지 확인하세요.'); process.exit(1); }
const dbg = (await get(`${G}/debug_token?input_token=${encodeURIComponent(page.access_token)}&access_token=${appTok}`)).data;
const missing = need.filter((s) => !(dbg.scopes || []).includes(s));
console.log('페이지 토큰:', dbg.is_valid ? '유효' : '무효', '· 만료', dbg.expires_at === 0 ? '없음' : new Date(dbg.expires_at * 1000).toISOString());
if (missing.length) { console.log('빠진 권한:', missing.join(', '), '→ .env 는 바꾸지 않았습니다.'); process.exit(1); }
const f = path.join(HERE, '.env');
const src = fs.readFileSync(f, 'utf8');
fs.writeFileSync(f + '.bak', src);
fs.writeFileSync(f, src.split(/\r?\n/).map((l) => l.startsWith('IG_PAGE_TOKEN=') ? `IG_PAGE_TOKEN=${page.access_token}` : l.startsWith('IG_TOKEN=') ? 'IG_TOKEN=' : l).join('\n'));
console.log('.env 갱신 완료(IG_PAGE_TOKEN 교체, IG_TOKEN 비움). 이전 파일은 .env.bak');

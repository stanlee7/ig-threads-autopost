// 릴스 1편 게시. 기본은 점검만, --go 를 붙여야 실제로 올린다.
// 실행: node post-reel.mjs --file 영상.mp4 --caption 캡션.txt [--thumb 1500] [--go]
//   --thumb: 표지로 쓸 화면 위치(밀리초)
import fs from 'node:fs';
import path from 'node:path';
import { env, api, V, loadState, saveState, arg, GO } from './ig.mjs';

const file = path.resolve(arg('--file'));
const caption = fs.readFileSync(path.resolve(arg('--caption')), 'utf8').trim();
const thumb = arg('--thumb') || '1500';
const size = fs.statSync(file).size;
const state = loadState(); state.files ||= {};
const key = path.basename(file);
console.log(`${key} · ${(size / 1e6).toFixed(1)}MB · 캡션 ${caption.length}자`);
if (state.files[key]) { console.log('이미 게시됨:', state.files[key].permalink); process.exit(0); }
if (!GO) { console.log('점검만 했습니다. 실제 게시는 --go'); process.exit(0); }

// 1) 컨테이너 만들기 → 2) 영상 직접 업로드(공개 주소 필요 없음) → 3) 처리 끝날 때까지 대기 → 4) 게시
const c = await api(`${env.IG_USER_ID}/media`, { method: 'POST', params: { media_type: 'REELS', upload_type: 'resumable', caption, share_to_feed: 'true', thumb_offset: thumb } });
const up = await fetch(`https://rupload.facebook.com/ig-api-upload/${V}/${c.id}`, {
  method: 'POST', headers: { Authorization: `OAuth ${env.IG_PAGE_TOKEN}`, offset: '0', file_size: String(size) }, body: fs.readFileSync(file),
});
const uj = await up.json();
if (!uj.success) throw new Error('업로드 실패: ' + JSON.stringify(uj.debug_info || uj));
let status = '';
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  status = (await api(c.id, { params: { fields: 'status_code' } })).status_code;
  if (status === 'FINISHED' || status === 'ERROR') break;
}
if (status !== 'FINISHED') throw new Error('처리 상태: ' + status);
const pub = await api(`${env.IG_USER_ID}/media_publish`, { method: 'POST', params: { creation_id: c.id } });
const info = await api(pub.id, { params: { fields: 'permalink,timestamp' } });
state.files[key] = { media_id: pub.id, permalink: info.permalink, at: info.timestamp };
saveState(state);
console.log('게시 완료:', info.permalink, '\nMEDIA_ID=' + pub.id);

// 댓글 키워드 → 자료 DM(비공개 답장). 기본은 점검만, --go 를 붙여야 보낸다.
// 설정: dm.json 에 게시물마다 { "media_id": "...", "keyword": "녹음", "message": "보낼 DM 본문" }
// 규칙: 댓글 1개에 한 번만 보냄. 인스타 정책상 비공개 답장은 댓글 후 7일 안에만 가능
import fs from 'node:fs';
import path from 'node:path';
import { env, api, HERE, loadState, saveState, GO } from './ig.mjs';

const posts = JSON.parse(fs.readFileSync(path.join(HERE, 'dm.json'), 'utf8'));
const state = loadState(); state.replied ||= {};
const WEEK = 7 * 864e5;
let hit = 0, sent = 0;
for (const p of posts) {
  const { data = [] } = await api(`${p.media_id}/comments`, { params: { fields: 'id,text,timestamp,from', limit: 100 } });
  for (const cm of data) {
    if (state.replied[cm.id] || cm.from?.id === env.IG_USER_ID) continue;
    if (!cm.text.replace(/\s/g, '').includes(p.keyword)) continue;
    if (Date.now() - Date.parse(cm.timestamp) > WEEK) continue;
    hit++;
    if (!GO) continue;
    try {
      await api(`${env.IG_PAGE_ID}/messages`, { method: 'POST', params: { recipient: JSON.stringify({ comment_id: cm.id }), message: JSON.stringify({ text: p.message.slice(0, 950) }) } });
      await api(`${cm.id}/replies`, { method: 'POST', params: { message: 'DM으로 보내드렸어요 📩' } });
      state.replied[cm.id] = { at: new Date().toISOString() }; // 사용자 이름과 댓글 본문은 기록하지 않음
      sent++;
    } catch (e) { console.log('실패', p.keyword, e.message); }
  }
}
saveState(state);
console.log(`키워드 댓글 ${hit}개 · 보낸 DM ${sent}개${GO ? '' : ' (점검만)'}`);

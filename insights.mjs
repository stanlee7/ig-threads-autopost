// 최근 게시물 성과를 한 표로 (모델 호출 없음). 사용: node insights.mjs [개수]
import { api, env } from './ig.mjs';
const n = +(process.argv[2] || 30);
const me = env.IG_USER_ID || (await api('me', { params: { fields: 'id' } })).id;
const { data } = await api(`${me}/media`, { params: { fields: 'id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink', limit: n } });
const rows = [];
for (const m of data) {
  let ins = {};
  for (const metrics of ['reach,saved,shares,views,follows,profile_visits', 'reach,saved,shares,views', 'reach,saved']) {
    try { const r = await api(`${m.id}/insights`, { params: { metric: metrics } }); for (const x of r.data) ins[x.name] = x.values?.[0]?.value ?? x.total_value?.value; break; } catch {}
  }
  rows.push({ 날짜: m.timestamp.slice(0, 10), 형식: m.media_product_type === 'REELS' ? '릴스' : (m.media_type === 'CAROUSEL_ALBUM' ? '캐러셀' : m.media_type), 도달: ins.reach ?? '', 조회: ins.views ?? '', 저장: ins.saved ?? '', 공유: ins.shares ?? '', 팔로우: ins.follows ?? '', 프로필: ins.profile_visits ?? '', 좋아요: m.like_count, 댓글: m.comments_count, 첫줄: (m.caption || '').split('\n')[0].slice(0, 40) });
}
console.log(['날짜','형식','도달','조회','저장','공유','팔로우','프로필','좋아요','댓글','첫줄'].join('\t'));
for (const r of rows) console.log(Object.values(r).join('\t'));

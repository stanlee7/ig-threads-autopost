// 공통: .env 읽기와 인스타그램 Graph API 호출. 토큰은 절대 화면에 출력하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const env = Object.fromEntries(
  fs.readFileSync(path.join(HERE, '.env'), 'utf8').split(/\r?\n/)
    .map(l => l.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)$/)).filter(Boolean)
    .map(m => [m[1], m[2].trim()]));
export const V = 'v23.0';
export const G = `https://graph.facebook.com/${V}`;

export async function api(pathname, { method = 'GET', params = {} } = {}) {
  const u = new URL(`${G}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: env.IG_PAGE_TOKEN });
  const r = method === 'GET' ? await fetch(`${u}?${body}`) : await fetch(u, { method, body });
  const j = await r.json();
  if (j.error) throw new Error(`${pathname}: ${j.error.message}`);
  return j;
}

// 게시 기록(같은 파일 중복 게시 방지, 이미 DM 보낸 댓글 기억)
export const statePath = path.join(HERE, 'state.json');
export const loadState = () => { try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { return {}; } };
export const saveState = s => fs.writeFileSync(statePath, JSON.stringify(s, null, 1));
export const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
export const GO = process.argv.includes('--go');

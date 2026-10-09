/**
 * つどいの森サイト 来訪者カウンター（Cloudflare Workers）
 *
 * エンドポイント
 *   GET /count … 現在の数を返すだけ（数は増えない）
 *   GET /hit   … 数を1増やしてから返す
 *
 * 数は Workers KV（名前空間 COUNTER、キー visits）に保存します。
 * KV が空のときは START_VALUE から始まります。
 */

const KEY = 'visits';
const START_VALUE = 194;

// このサイト以外からは呼び出せないようにする
const ALLOWED_ORIGINS = [
  'https://tsudoinomori.iwate.jp',
  'https://www.tsudoinomori.iwate.jp',
  'https://tsudoinomori.github.io',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
    }

    const path = new URL(request.url).pathname;
    const stored = await env.COUNTER.get(KEY);
    let count = stored === null ? START_VALUE : parseInt(stored, 10);
    if (Number.isNaN(count)) count = START_VALUE;

    if (path === '/hit') {
      count += 1;
      await env.COUNTER.put(KEY, String(count));
    } else if (path !== '/count' && path !== '/') {
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });
    }

    return new Response(JSON.stringify({ count }), { headers });
  },
};

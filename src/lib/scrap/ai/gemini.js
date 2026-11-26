import crypto from 'node:crypto';
import https from 'node:https';

const CONFIG = {
  UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  UA_MOBILE: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
  TIMEOUT: Math.max(8000, Math.min(Number(process.env.REQUEST_TIMEOUT) || 20000, 25000)),
  HOME: 'https://gemini.google.com/app',
  ENDPOINT: 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
  BATCH: 'https://gemini.google.com/_/BardChatUi/data/batchexecute',
};

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 15000 });

const hex = n => crypto.randomBytes(n).toString('hex');
const uuid = () => crypto.randomUUID().toUpperCase();
const reqid = () => Math.floor(Math.random() * 900000) + 100000;
const pack = obj => Buffer.from(JSON.stringify(obj)).toString('base64');
const unpack = value => {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
};

function generateAtToken() {
  const random = crypto.randomBytes(16).toString('base64url').slice(0, 22);
  return `AOOh${random}:${Date.now() * 1000}`;
}
function generateFSid() {
  return `-${crypto.randomInt(100000000, 900000000)}${crypto.randomInt(100000000, 900000000)}`;
}
function generateTokenBlob() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const random = n => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return '!' + random(24) + 'NAAa-PB6hnjxC' + random(18) + 'AEABE' + random(12) +
    'Z1IzrYRasYCYYnM4bZXAlvfpPcJe2g2Ye8XDL3Ck5BCikk5IYm5xZrnIsIkA0SEgfgSLBh-eSq-mq5McSAgAA' +
    random(8) + 'SAAAC' + random(8) + 'BB34ARK' + random(1100);
}

// 🚀 تم إزالة السطر الذي كان يحول ** إلى *
function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\\\\"/g, '"')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\\\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

let bootCache = { data: null, exp: 0 };
let bootPromise = null;

async function bootstrap(force = false) {
  if (!force && bootCache.data && Date.now() < bootCache.exp) return bootCache.data;
  if (!force && bootPromise) return bootPromise;

  const task = (async () => {
    const res = await fetch(CONFIG.HOME, {
      headers: { 'user-agent': CONFIG.UA, 'accept-language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(CONFIG.TIMEOUT),
    });
    if (!res.ok) throw new Error(`AI service bootstrap HTTP ${res.status}`);

    const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
    const html = await res.text();
    const data = {
      cookie,
      bl: (html.match(/"cfb2h":"(.*?)"/) || [])[1] || '',
      fsid: (html.match(/"FdrFJe":"(.*?)"/) || [])[1] || '',
      snlM0e: (html.match(/"SNlM0e":"(.*?)"/) || [])[1] || '',
      uid: uuid(),
      atToken: generateAtToken(),
      tokenBlob: generateTokenBlob(),
    };
    if (!data.bl || !data.fsid) throw new Error('AI service bootstrap tokens were not found.');
    bootCache = { data, exp: Date.now() + 5 * 60_000 };
    return data;
  })();

  if (!force) bootPromise = task;
  try {
    return await task;
  } finally {
    if (bootPromise === task) bootPromise = null;
  }
}

function buildBody(message, resume, uid) {
  const inner = [
    [message, 0, null, null, null, null, 0], ['en-US'], resume, '', hex(16),
    null, [1], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 0,
    null, null, null, null, null, null, null, null, 1, null, null, [4],
    null, null, null, null, null, null, null, null, null, null, [2],
    null, null, null, null, null, null, null, null, null, null, null, 0,
    null, null, null, null, null, uid, null, [], null, null, null, null, null, null, 2,
    null, null, null, null, null, null, null, null, null, null, 1,
  ];
  return 'f.req=' + encodeURIComponent(JSON.stringify([null, JSON.stringify(inner)])) + '&';
}

function buildBodyAlt(message, instruction = '', resumeArray = null) {
  const requestBody = [
    [message, 0, null, null, null, null, 0], ['en-US'],
    resumeArray || ['', '', '', null, null, null, null, null, null, ''],
    null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null,
    [[0]], 1, null, null, null, null, null,
    ['', '', instruction, null, null, null, null, null, 0, null, 1, null, null, null, []],
    null, null, 1, null, null, null, null, null, null, null,
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    1, null, null, null, null, [1],
  ];
  return [null, JSON.stringify(requestBody)];
}

function parseReply(raw) {
  const out = { text: '', conversationId: null, responseId: null, replyId: null };
  let best = '';
  for (const line of String(raw || '').split('\n')) {
    const s = line.trim();
    if (!s.startsWith('[["wrb.fr"')) continue;
    let outer;
    try { outer = JSON.parse(s); } catch { continue; }
    for (const row of outer) {
      if (!Array.isArray(row) || row[0] !== 'wrb.fr' || typeof row[2] !== 'string') continue;
      let body;
      try { body = JSON.parse(row[2]); } catch { continue; }
      const ids = body[1];
      if (Array.isArray(ids)) {
        if (typeof ids[0] === 'string' && ids[0].startsWith('c_')) out.conversationId = ids[0];
        if (typeof ids[1] === 'string' && ids[1].startsWith('r_')) out.responseId = ids[1];
      }
      const seg = Array.isArray(body[4]) ? body[4][0] : null;
      if (seg) {
        if (seg[0]) out.replyId = seg[0];
        if (Array.isArray(seg[1])) {
          const piece = seg[1].filter(v => typeof v === 'string').join('');
          if (piece.length > best.length) best = piece;
        }
      }
    }
  }
  out.text = best.trim();
  return out;
}

function parseMethod2(raw) {
  const lines = String(raw || '').split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line || /^\d+$/.test(line) || line.startsWith(")]}'")) continue;
    try {
      const outer = JSON.parse(line);
      const candidate = outer?.[0]?.[2];
      if (typeof candidate !== 'string') continue;
      const parsed = JSON.parse(candidate);
      const text = parsed?.[4]?.[0]?.[1]?.[0];
      if (typeof text === 'string' && text.trim()) return { parsed, text };
    } catch {}
  }
  return null;
}

async function geminiMethod1(message, options = {}) {
  const session = await bootstrap();
  const resume = options.sessionId ? unpack(options.sessionId) : null;
  const resumeArray = resume?.resume || ['', '', '', null, null, null, null, null, null, ''];
  const cookie = resume?.cookie || session.cookie;
  const uid = resume?.uid || session.uid;
  const url = new URL(CONFIG.ENDPOINT);
  url.searchParams.set('bl', session.bl);
  url.searchParams.set('f.sid', session.fsid);
  url.searchParams.set('hl', 'en-US');
  url.searchParams.set('_reqid', String(reqid()));
  url.searchParams.set('rt', 'c');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': CONFIG.UA,
      origin: 'https://gemini.google.com',
      referer: 'https://gemini.google.com/',
      'x-same-domain': '1',
      'x-goog-ext-525001261-jspb': JSON.stringify([1, null, null, null, hex(8), null, null, 0, [4, 6], null, null, 1, null, null, 1, null, uuid()]),
      'x-goog-ext-525005358-jspb': JSON.stringify([uid, 1]),
      'x-goog-ext-73010990-jspb': '[0,0,0]',
      'x-goog-ext-73010989-jspb': '[0]',
      cookie,
    },
    body: buildBody(message, resumeArray, uid),
    signal: AbortSignal.timeout(CONFIG.TIMEOUT),
  });
  if (!res.ok) throw new Error(`Method 1: HTTP ${res.status}`);
  const raw = await res.text();
  const reply = parseReply(raw);
  if (!reply.text) throw new Error('Method 1: response text not found.');
  return {
    success: true,
    response: cleanText(reply.text),
    sessionId: pack({ cookie, resume: [reply.conversationId, reply.responseId, reply.replyId], uid }),
    method: 'method1',
    conversationId: reply.conversationId,
    responseId: reply.responseId,
  };
}

async function geminiMethod2(message, options = {}) {
  let resumeArray = null;
  let cookie = null;
  let instruction = options.instruction || '';
  if (options.sessionId) {
    const saved = unpack(options.sessionId);
    if (saved) {
      resumeArray = saved.resumeArray || null;
      cookie = saved.cookie || null;
      instruction = options.instruction || saved.instruction || '';
    }
  }
  if (!cookie) {
    const boot = await fetch(
      `${CONFIG.BATCH}?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=en-US&_reqid=173780&rt=c`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', 'user-agent': CONFIG.UA },
        body: 'f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&',
        signal: AbortSignal.timeout(CONFIG.TIMEOUT),
      }
    );
    if (!boot.ok) throw new Error(`Method 2 bootstrap HTTP ${boot.status}`);
    const sc = boot.headers.getSetCookie ? boot.headers.getSetCookie() : [];
    cookie = sc[0]?.split(';')[0] || '';
  }
  const payload = buildBodyAlt(message, instruction, resumeArray);
  const form = new URLSearchParams();
  form.append('f.req', JSON.stringify(payload));
  const res = await fetch(
    `${CONFIG.ENDPOINT}?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=en-US&_reqid=2813378&rt=c`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'x-goog-ext-525001261-jspb': '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
        cookie,
        'user-agent': CONFIG.UA,
      },
      body: form.toString(),
      signal: AbortSignal.timeout(CONFIG.TIMEOUT),
    }
  );
  if (!res.ok) throw new Error(`Method 2: HTTP ${res.status}`);
  const raw = await res.text();
  const result = parseMethod2(raw);
  if (!result) throw new Error('Method 2: could not parse response.');
  const parsed = result.parsed;
  const newResumeArray = [...(Array.isArray(parsed[1]) ? parsed[1] : []), parsed?.[4]?.[0]?.[0] || null];
  const text = cleanText(result.text);
  if (!text) throw new Error('Method 2: empty response.');
  return {
    success: true,
    response: text,
    sessionId: pack({ resumeArray: newResumeArray, cookie, instruction }),
    method: 'method2',
    conversationId: parsed?.[1]?.[0] || null,
    responseId: parsed?.[1]?.[1] || null,
  };
}

class GeminiClient {
  constructor(opts = {}) {
    this.atToken = opts.atToken || generateAtToken();
    this.fSid = opts.fSid || generateFSid();
    this.bl = opts.bl || 'boq_assistant-bard-web-server_20260603.11_p0';
    this.cookie = opts.cookie || '';
    this.tokenBlob = opts.tokenBlob || generateTokenBlob();
    this.deviceId = opts.deviceId || crypto.randomUUID();
    this.hl = opts.hl || 'id';
    this._reqid = Math.floor(Math.random() * 10000000);
    this._sessionId = opts.sessionToken || crypto.randomBytes(16).toString('hex');
  }

  _headers(extra = {}) {
    const h = {
      accept: '*/*',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      origin: 'https://gemini.google.com',
      referer: 'https://gemini.google.com/',
      'user-agent': CONFIG.UA_MOBILE,
      'x-same-domain': '1',
      'x-goog-ext-525001261-jspb': `[1,null,null,null,"fbb127bbb056c959",null,null,0,[4],null,null,1,null,null,1,null,"${this.deviceId}"]`,
      'x-goog-ext-525005358-jspb': `["${this.deviceId}",1]`,
      'x-goog-ext-73010989-jspb': '[0]',
      'x-goog-ext-73010990-jspb': '[0,0,0]',
    };
    if (this.cookie) h.cookie = this.cookie;
    return Object.assign(h, extra);
  }

  _buildPayload(message, resumeArray = null) {
    const inner = [
      [message, 0, null, null, null, null, 0], ['id'],
      resumeArray || ['', '', '', null, null, null, null, null, null, ''], this.tokenBlob, this._sessionId,
      null, [0], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 0,
      null, null, null, null, null, null, null, null, 1, null, null, [4],
      null, null, null, null, null, null, null, null, null, null, [2],
      null, null, null, null, null, null, null, null, null, null, null, 0,
      null, null, null, null, null, this.deviceId, null, [], null, null, null, null, null, null, 1,
      null, null, null, null, null, null, null, null, null, null, 1,
    ];
    const params = new URLSearchParams();
    params.append('f.req', JSON.stringify([null, JSON.stringify(inner)]));
    params.append('at', this.atToken);
    return params.toString();
  }

  async sendMessage(message, onChunk, resumeArray = null) {
    this._reqid++;
    const payload = this._buildPayload(message, resumeArray);
    const url = new URL(CONFIG.ENDPOINT);
    url.searchParams.set('bl', this.bl);
    url.searchParams.set('f.sid', this.fSid);
    url.searchParams.set('hl', this.hl);
    url.searchParams.set('_reqid', String(this._reqid));
    url.searchParams.set('rt', 'c');

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: this._headers({ 'content-length': String(Buffer.byteLength(payload)) }),
          timeout: CONFIG.TIMEOUT,
          agent: httpsAgent,
        },
        res => {
          if (res.statusCode >= 400) {
            let body = '';
            res.on('data', c => (body += c.toString('utf8')));
            res.on('end', () => reject(new Error(`Method 3: HTTP ${res.statusCode}: ${body.slice(0, 200)}`)));
            return;
          }
          let buffer = '';
          let fullText = '';
          let emittedLength = 0;
          let conversationId = null;
          let responseId = null;
          let replyId = null;

          res.on('data', chunk => {
            buffer += chunk.toString('utf8');
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (let line of lines) {
              line = line.trim();
              if (line.startsWith(")]}'")) line = line.slice(4);
              if (!line || /^\d+$/.test(line)) continue;
              let outer;
              try { outer = JSON.parse(line); } catch { continue; }
              const encoded = outer?.[0]?.[2];
              if (typeof encoded !== 'string') continue;
              let inner;
              try { inner = JSON.parse(encoded); } catch { continue; }
              if (Array.isArray(inner[1])) {
                if (inner[1][0]) conversationId = inner[1][0];
                if (inner[1][1]) responseId = inner[1][1];
              }
              const messages = inner[4];
              if (Array.isArray(messages)) {
                for (const block of messages) {
                  if (block?.[0]) replyId = block[0];
                  const arr = block?.[1];
                  if (Array.isArray(arr)) {
                    const candidate = arr.filter(v => typeof v === 'string').join('');
                    if (candidate.length > fullText.length) {
                      if (onChunk && candidate.length > emittedLength) {
                        const delta = candidate.slice(emittedLength);
                        if (delta) {
                          try { onChunk(delta); } catch {}
                          emittedLength = candidate.length;
                        }
                      }
                      fullText = candidate;
                    }
                  }
                }
              }
            }
          });
          res.on('end', () => {
            if (buffer.trim()) {
              try {
                let line = buffer.trim();
                if (line.startsWith(")]}'")) line = line.slice(4);
                if (line && !/^\d+$/.test(line)) {
                  const outer = JSON.parse(line);
                  const encoded = outer?.[0]?.[2];
                  if (typeof encoded === 'string') {
                    const inner = JSON.parse(encoded);
                    const arr = inner?.[4]?.[0]?.[1];
                    if (Array.isArray(arr)) {
                      const candidate = arr.filter(v => typeof v === 'string').join('');
                      if (candidate.length > emittedLength) {
                        const delta = candidate.slice(emittedLength);
                        if (onChunk && delta) try { onChunk(delta); } catch {}
                      }
                    }
                  }
                }
              } catch {}
            }
            if (!fullText.trim()) return reject(new Error('Method 3: empty or unrecognized response.'));
            resolve({ text: fullText.trim(), conversationId, responseId, replyId });
          });
          res.on('error', reject);
        }
      );
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('Method 3: request timed out.')));
      req.write(payload);
      req.end();
    });
  }
}

async function geminiMethod3(message, options = {}) {
  const saved = options.sessionId ? unpack(options.sessionId) : null;
  let boot;
  try { boot = await bootstrap(); } catch { boot = null; }
  const client = new GeminiClient({
    cookie: saved?.cookie || boot?.cookie,
    bl: saved?.bl || boot?.bl,
    fSid: saved?.fSid || boot?.fsid,
    atToken: saved?.atToken || boot?.snlM0e || generateAtToken(),
    tokenBlob: saved?.tokenBlob || boot?.tokenBlob,
    deviceId: saved?.deviceId,
    sessionToken: saved?.sessionToken,
    hl: saved?.hl || 'id',
  });
  const result = await client.sendMessage(message, options.onChunk, saved?.resume || null);
  const sessionId = pack({
    provider: 'method3',
    resume: [result.conversationId, result.responseId, result.replyId],
    cookie: client.cookie, bl: client.bl, fSid: client.fSid,
    atToken: client.atToken, tokenBlob: client.tokenBlob,
    deviceId: client.deviceId, sessionToken: client._sessionId, hl: client.hl,
  });
  return {
    success: true, response: cleanText(result.text), sessionId,
    conversationId: result.conversationId, responseId: result.responseId, method: 'method3',
  };
}

const SOURCES = [
  { name: 'method1', fn: geminiMethod1 },
  { name: 'method2', fn: geminiMethod2 },
  { name: 'method3', fn: geminiMethod3 },
];


async function officialGeminiRequest(message, onChunk) {
  const apiKey = process.env.WINE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('لم يتم ضبط مفتاح خدمة الذكاء الاصطناعي في إعدادات الموقع.');
    error.code = 'NO_API_KEY';
    throw error;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = onChunk
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message || '';
    } catch {}
    const error = new Error(
      response.status === 429
        ? 'وصلت خدمة الذكاء الاصطناعي إلى حد الاستخدام حالياً. حاول لاحقاً.'
        : `AI service HTTP ${response.status}${detail ? ': ' + detail.slice(0, 240) : ''}`
    );
    error.status = response.status;
    throw error;
  }

  if (!onChunk) {
    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map(part => typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim();
    if (!text) throw new Error('لم تصل إجابة من خدمة الذكاء الاصطناعي.');
    return { success: true, response: cleanText(text), sessionId: null, method: 'gemini-api' };
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('البث المباشر للرد غير متاح حالياً.');
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      let data;
      try { data = JSON.parse(payload); } catch { continue; }
      const piece = (data?.candidates?.[0]?.content?.parts || [])
        .map(part => typeof part.text === 'string' ? part.text : '')
        .join('');
      if (piece) {
        fullText += piece;
        try { onChunk(piece); } catch {}
      }
    }
  }
  if (buffer.trim().startsWith('data:')) {
    try {
      const data = JSON.parse(buffer.trim().slice(5).trim());
      const piece = (data?.candidates?.[0]?.content?.parts || [])
        .map(part => typeof part.text === 'string' ? part.text : '')
        .join('');
      if (piece) { fullText += piece; try { onChunk(piece); } catch {} }
    } catch {}
  }
  if (!fullText.trim()) throw new Error('لم يصل رد من خدمة الذكاء الاصطناعي.');
  return { success: true, response: cleanText(fullText), sessionId: null, method: 'gemini-api' };
}

const gemini = {
  async chat(params = {}) {
    if (typeof params.prompt !== 'string' || !params.prompt.trim()) throw new Error('prompt مطلوب');
    try {
      return await officialGeminiRequest(params.prompt.trim());
    } catch (error) {
      console.warn('[WINE AI provider]', String(error?.message || error).slice(0, 220));
      if (error?.status === 429 || error?.status === 403 || error?.code === 'NO_API_KEY') throw error;
    }

    const savedSession = params.sessionId ? unpack(params.sessionId) : null;
    const isMethod1Session = Boolean(savedSession?.resume && !savedSession?.provider);
    const isMethod2Session = Boolean(savedSession?.resumeArray);
    const isMethod3Session = savedSession?.provider === 'method3';
    const preferred = isMethod3Session ? SOURCES[2] : isMethod1Session ? SOURCES[0] : isMethod2Session ? SOURCES[1] : SOURCES[2];
    const errors = [];

    if (!params.skipMethod3 || preferred !== SOURCES[2]) {
      try {
        const result = await preferred.fn(params.prompt.trim(), { sessionId: params.sessionId, instruction: params.instruction });
        if (result?.success && result.response) return result;
        errors.push(preferred.name + ': empty response');
      } catch (error) {
        const msg = String(error?.message || error).slice(0, 180);
        errors.push(preferred.name + ': ' + msg);
        console.warn('[WINE AI primary]', msg);
      }
    }

    const fallbacks = SOURCES.filter(source => source !== preferred && !(params.skipMethod3 && source === SOURCES[2]));
    if (!fallbacks.length) throw new Error('محرك الذكاء الاصطناعي لم يستجب. حاول مرة أخرى.');
    try {
      return await Promise.any(fallbacks.map(async source => {
        const result = await source.fn(params.prompt.trim(), { sessionId: params.sessionId, instruction: params.instruction });
        if (result?.success && result.response) return result;
        throw new Error(source.name + ': empty response');
      }));
    } catch (error) {
      const reasons = error?.errors?.map(item => item.message).filter(Boolean) || [];
      throw new Error(('تعذر الاتصال بمحرك الذكاء الاصطناعي. ' + [...errors, ...reasons].join(' | ')).slice(0, 700));
    }
  },

  async chatStream(params = {}, onChunk) {
    if (typeof params.prompt !== 'string' || !params.prompt.trim()) throw new Error('prompt مطلوب');
    try {
      return await officialGeminiRequest(params.prompt.trim(), onChunk || (() => {}));
    } catch (error) {
      console.warn('[WINE AI stream]', String(error?.message || error).slice(0, 220));
      if (error?.status === 429 || error?.status === 403 || error?.code === 'NO_API_KEY') throw error;
      const result = await this.chat({ ...params, skipMethod3: true });
      if (result.response) { try { onChunk?.(result.response); } catch {} }
      return result;
    }
  }
};

export default gemini;


// WINE_BOOTSTRAP_WARMUP: warm the provider session while the serverless instance starts.
void bootstrap().catch(error => console.warn('[WINE AI warmup]', String(error?.message || error).slice(0, 160)));

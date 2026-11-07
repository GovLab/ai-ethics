#!/usr/bin/env node
// Build step for aiethicscourse.org (Netlify runs `node scripts/prerender.mjs`, see netlify.toml).
//
// The lecture and webinar pages are filled in the browser by Vue from the JSON files in data/,
// so crawlers that do not run JavaScript (GPTBot, ClaudeBot, PerplexityBot, ...) only see the
// empty page frame. This script copies the site into dist/ and writes, for every lecture in
// data/lecture.json and every webinar series in data/webinars.json:
//   - dist/lectures/<slug>.html and dist/webinars/<slug>.html with the page text already in the
//     HTML, rendered from the same Vue template the browser uses (so the markup is the markup Vue
//     produces; Vue then re-renders it with identical output),
//   - the Vue template moved into <script type="text/x-template"> and the page data into
//     <script type="application/json">, so the existing JavaScript renders from the same data,
//   - title, meta description, canonical, Open Graph / Twitter tags and schema.org JSON-LD,
//   - a Markdown copy next to each page (<slug>.md),
// plus sitemap.xml, llms.txt, llms-full.txt and _headers.
//
// The content lives in data/*.json in this repository, so every push that changes it rebuilds
// the pages; no CMS hook is needed.
//
// No dependencies: Node 24 (fs). Usage: node scripts/prerender.mjs [--out dist]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const OUT = path.resolve(ROOT, outArg > -1 ? process.argv[outArg + 1] : 'dist');
const SITE = 'https://aiethicscourse.org';
const SITE_NAME = 'AI Ethics: Global Perspectives';
const LICENSE = 'https://creativecommons.org/licenses/by-sa/4.0/';
const SITE_IMAGE = `${SITE}/img/thumbnail.png`;
// As stated in the page footers (lectures/index.html, webinars/index.html).
const FOOTER_LICENCE = 'Creative Commons Attribution-ShareAlike 4.0 International (http://creativecommons.org/licenses/by-sa/4.0/)';
const SOURCE = 'AI Ethics: Global Perspectives (aiethicscourse.org)';
const COURSE_DESCRIPTION = 'AI Ethics: Global Perspectives is a free, online course designed to raise awareness and help institutions work toward a more responsible use of AI. It brings together leading experts in the field of AI from around the world to consider ethical ramifications of AI and rectify initiatives that might be harmful to particular people and groups in society.';
const GOVLAB = { '@type': 'Organization', '@id': 'https://thegovlab.org/#organization', name: 'The Governance Lab', alternateName: 'The GovLab', url: 'https://thegovlab.org/' };
const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: SITE_NAME };
const COURSE = { '@type': 'Course', '@id': `${SITE}/#course`, name: SITE_NAME, url: `${SITE}/`, description: COURSE_DESCRIPTION, provider: { '@id': GOVLAB['@id'] }, isAccessibleForFree: true, inLanguage: 'en' };

// ---------------------------------------------------------------------------------------------
// Minimal renderer for the subset of Vue 2.0 templates these pages use. It follows Vue 2.0's
// template parser (whitespace handling, v-for before v-if, v-if/v-else pairing, empty comment
// for a false v-if, _s() for interpolation) so that its output equals the DOM Vue renders.
// Expressions are evaluated like Vue does: `with(scope)`, unknown names resolve to undefined.
// ---------------------------------------------------------------------------------------------
const makeSet = (s) => new Set(s.split(','));
const VOID_TAGS = makeSet('area,base,br,col,embed,frame,hr,img,input,isindex,keygen,link,meta,param,source,track,wbr');
const NON_PHRASING = makeSet('address,article,aside,base,blockquote,body,caption,col,colgroup,dd,details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,title,tr,track');
const CAN_BE_LEFT_OPEN = makeSet('colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source');
const BOOLEAN_ATTRS = makeSet('allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,default,defaultchecked,defaultmuted,defaultselected,defer,disabled,enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,required,reversed,scoped,seamless,selected,sortable,translate,truespeed,typemustmatch,visible');
const ALLOWED_GLOBALS = makeSet('Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,require');
const ATTR_RE = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const START_OPEN_RE = /^<([a-zA-Z_][\w\-.]*)/;
const START_CLOSE_RE = /^\s*(\/?)>/;
const END_TAG_RE = /^<\/([a-zA-Z_][\w\-.]*)[^>]*>/;

// Parses the element starting at html[0] and returns { root, length }.
function parseTemplate(html) {
  const stack = [];
  let root = null;
  let current = null;
  let i = 0;
  const closeTag = (tag) => {
    let pos = stack.length - 1;
    while (pos >= 0 && stack[pos].tag !== tag) pos--;
    if (pos < 0) {
      if (tag === 'br' || tag === 'p') openTag(tag, [], tag === 'br');
      if (tag === 'p') closeTag('p');
      return;
    }
    while (stack.length > pos) {
      const el = stack.pop();
      const last = el.children[el.children.length - 1];
      if (last && last.type === 3 && last.text === ' ') el.children.pop();
    }
    current = stack[stack.length - 1] || null;
  };
  const openTag = (tag, attrs, unary) => {
    const lastTag = current && current.tag;
    if (lastTag === 'p' && NON_PHRASING.has(tag)) closeTag('p');
    if (CAN_BE_LEFT_OPEN.has(tag) && current && current.tag === tag) closeTag(tag);
    const el = makeElement(tag, attrs);
    if (!root) root = el;
    else if (current) {
      if (el.else) {
        const prev = [...current.children].reverse().find((c) => c.type === 1);
        if (!prev || !prev.if) throw new Error(`v-else without v-if in <${tag}>`);
        prev.elseBlock = el;
      } else current.children.push(el);
    }
    if (!unary) { stack.push(el); current = el; }
  };
  const chars = (text) => {
    if (!current) return;
    text = text.trim() ? text : current.children.length ? ' ' : '';
    if (!text) return;
    if (text !== ' ' && text.includes('{{')) current.children.push({ type: 2, segments: parseText(text) });
    else current.children.push({ type: 3, text });
  };
  while (i < html.length) {
    const rest = html.slice(i);
    if (rest.startsWith('<!--')) {
      const end = rest.indexOf('-->');
      if (end < 0) throw new Error('Unclosed comment in template');
      i += end + 3;
      continue;
    }
    let m = rest.match(END_TAG_RE);
    if (m) {
      i += m[0].length;
      closeTag(m[1].toLowerCase());
      if (root && !stack.length) return { root, length: i };
      continue;
    }
    m = rest.match(START_OPEN_RE);
    if (m) {
      let pos = m[0].length;
      const attrs = [];
      let close;
      let am;
      while (!(close = rest.slice(pos).match(START_CLOSE_RE)) && (am = rest.slice(pos).match(ATTR_RE))) {
        pos += am[0].length;
        attrs.push([am[1], am[3] ?? am[4] ?? am[5] ?? '']);
      }
      if (close) {
        const tag = m[1].toLowerCase();
        i += pos + close[0].length;
        openTag(tag, attrs, VOID_TAGS.has(tag) || close[1] === '/');
        if (root && !stack.length) return { root, length: i };
        continue;
      }
    }
    // Text up to the next '<' that starts a tag or comment (a lone '<' stays text, as in Vue).
    let end = rest.indexOf('<', 1);
    while (end > -1 && !/^<(\/?[a-zA-Z_]|!--)/.test(rest.slice(end))) end = rest.indexOf('<', end + 1);
    if (end < 0) end = rest.length;
    chars(rest.slice(0, end));
    i += end;
  }
  throw new Error('Template root element is not closed');
}

function parseText(text) {
  const segments = [];
  const re = /\{\{((?:.|\n)+?)\}\}/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    segments.push({ exp: m[1].trim() });
    last = re.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

function makeElement(tag, attrsList) {
  const el = { type: 1, tag, attrs: [], bound: [], children: [], staticClass: null, classBinding: null, staticStyle: null, styleBinding: null };
  for (const [name, value] of attrsList) {
    if (name === 'v-for') {
      const m = value.match(/(.*?)\s+(?:in|of)\s+(.*)/);
      if (!m) throw new Error(`Bad v-for: ${value}`);
      el.for = m[2].trim();
      const alias = m[1].trim();
      const it = alias.match(/\((\{[^}]*\}|[^,]*),([^,]*)(?:,([^,]*))?\)/);
      if (it) { el.alias = it[1].trim(); el.iterator1 = it[2].trim(); el.iterator2 = it[3] && it[3].trim(); } else el.alias = alias;
    } else if (name === 'v-if') el.if = value;
    else if (name === 'v-else') el.else = true;
    else if (name === 'v-html') el.html = value;
    else if (name === 'v-cloak' || name.startsWith('v-on:') || name.startsWith('@')) continue;
    else if (name === 'key' || name === 'ref' || name === ':key' || name === 'v-bind:key') continue;
    else if (name.startsWith(':') || name.startsWith('v-bind:')) {
      const attr = name.startsWith(':') ? name.slice(1) : name.slice(7);
      if (attr === 'class') el.classBinding = value;
      else if (attr === 'style') el.styleBinding = value;
      else el.bound.push([attr, value]);
    } else if (name.startsWith('v-')) throw new Error(`Unsupported directive ${name} in <${tag}>`);
    else if (name === 'class') el.staticClass = value;
    else if (name === 'style') el.staticStyle = value;
    else el.attrs.push([name, value]);
  }
  return el;
}

const fnCache = new Map();
const scopeHandler = {
  has: (target, key) => (typeof key !== 'string' ? key in target : key in target || !(ALLOWED_GLOBALS.has(key) || key[0] === '_')),
};
function evaluate(exp, scope) {
  let fn = fnCache.get(exp);
  if (!fn) {
    // eslint-disable-next-line no-new-func
    fn = new Function('__scope', `with (__scope) { return (${exp}); }`);
    fnCache.set(exp, fn);
  }
  return fn(new Proxy(scope, scopeHandler));
}

const toDisplayString = (val) => (val == null ? '' : typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val));
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const hyphenate = (s) => s.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
// A static text part like "&nbsp" right before an interpolation needs its ';' once the value follows.
const closeEntity = (s) => s.replace(/(&[a-zA-Z][a-zA-Z0-9]*)$/, '$1;');

function renderList(val, fn) {
  const out = [];
  if (Array.isArray(val) || typeof val === 'string') for (let i = 0; i < val.length; i++) out.push(fn(val[i], i));
  else if (typeof val === 'number') for (let i = 0; i < val; i++) out.push(fn(i + 1, i));
  else if (val && typeof val === 'object') Object.keys(val).forEach((key, i) => out.push(fn(val[key], key, i)));
  return out.join('');
}

function stringifyClass(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(stringifyClass).filter(Boolean).join(' ');
  return Object.keys(value).filter((k) => value[k]).join(' ');
}

function renderNode(node, scope) {
  if (node.type === 3) return node.text;
  if (node.type === 2) {
    return node.segments
      .map((seg, idx) => {
        if (seg.exp) return escapeText(toDisplayString(evaluate(seg.exp, scope)));
        return node.segments[idx + 1] && node.segments[idx + 1].exp ? closeEntity(seg.text) : seg.text;
      })
      .join('');
  }
  if (node.for !== undefined) {
    return renderList(evaluate(node.for, scope), (item, key, index) => {
      const child = Object.create(scope);
      child[node.alias] = item;
      if (node.iterator1) child[node.iterator1] = key;
      if (node.iterator2) child[node.iterator2] = index;
      return renderIf(node, child);
    });
  }
  return renderIf(node, scope);
}

function renderIf(el, scope) {
  if (el.if === undefined) return renderElement(el, scope);
  if (evaluate(el.if, scope)) return renderElement(el, scope);
  return el.elseBlock ? renderNode(el.elseBlock, scope) : '<!---->';
}

function renderElement(el, scope) {
  if (el.tag === 'template') return el.children.map((c) => renderNode(c, scope)).join('');
  const attrs = new Map();
  for (const [name, value] of el.attrs) if (!attrs.has(name)) attrs.set(name, BOOLEAN_ATTRS.has(name) ? name : value);
  for (const [name, exp] of el.bound) {
    const value = evaluate(exp, scope);
    if (value == null || value === false) attrs.delete(name);
    else attrs.set(name, BOOLEAN_ATTRS.has(name) ? name : String(value));
  }
  const dynClass = el.classBinding ? stringifyClass(evaluate(el.classBinding, scope)) : '';
  const cls = el.staticClass ? (dynClass ? `${el.staticClass} ${dynClass}` : el.staticClass) : dynClass;
  let html = `<${el.tag}`;
  if (cls) html += ` class="${escapeAttr(cls)}"`;
  const styles = [];
  if (el.staticStyle) styles.push(el.staticStyle);
  if (el.styleBinding) {
    const st = evaluate(el.styleBinding, scope) || {};
    for (const [k, v] of Object.entries(st)) if (v != null && v !== '') styles.push(`${hyphenate(k)}: ${v}`);
  }
  if (styles.length) html += ` style="${escapeAttr(styles.join('; '))}"`;
  for (const [name, value] of attrs) html += ` ${name}="${escapeAttr(value)}"`;
  html += '>';
  if (VOID_TAGS.has(el.tag)) return html;
  const inner = el.html !== undefined ? toDisplayString(evaluate(el.html, scope)) : el.children.map((c) => renderNode(c, scope)).join('');
  return `${html}${inner}</${el.tag}>`;
}

// Replaces the element with id=rootId in `page` by its pre-rendered markup, followed by the
// original template (for Vue) and the page data (for the page's own script).
function prerenderRoot(page, { rootId, templateId, dataId, scope, data }) {
  const idx = page.search(new RegExp(`<[a-zA-Z]+[^>]*\\sid="${rootId}"`));
  if (idx < 0) throw new Error(`#${rootId} not found`);
  const { root, length } = parseTemplate(page.slice(idx));
  const source = page.slice(idx, idx + length);
  if (/<\/script/i.test(source)) throw new Error(`#${rootId} template contains </script>`);
  const rendered = renderNode(root, scope);
  const block = [
    rendered,
    `<script type="text/x-template" id="${templateId}">${source}</script>`,
    `<script type="application/json" id="${dataId}">${safeJson(data)}</script>`,
  ].join('\n');
  return page.slice(0, idx) + block + page.slice(idx + length);
}

// ---------------------------------------------------------------------------------------------
// Head tags and helpers
// ---------------------------------------------------------------------------------------------
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', eacute: 'é', aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', ccedil: 'ç', uuml: 'ü', ouml: 'ö', auml: 'ä' };
function plainText(html) {
  return String(html || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);?/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}
function truncate(text, max = 300) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,;:.]+$/, '')}…`;
}

// ---------------------------------------------------------------------------------------------
// Markdown copies (for the GovLab Open Corpus, llms.txt and llms-full.txt)
// ---------------------------------------------------------------------------------------------
const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);?/gi, (m, n) => (n.toLowerCase() === 'nbsp' ? ' ' : ENTITIES[n.toLowerCase()] ?? m));

const MD_BLOCK = makeSet('address,article,aside,blockquote,dd,div,dl,dt,figcaption,figure,footer,h1,h2,h3,h4,h5,h6,header,hr,li,main,nav,ol,p,pre,section,table,tbody,td,tfoot,th,thead,tr,ul');

// Lenient HTML -> tree, enough for CMS rich text.
function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const closeTo = (tags, stopAt) => {
    for (let i = stack.length - 1; i > 0; i--) {
      if (stopAt.includes(stack[i].tag)) return;
      if (tags.includes(stack[i].tag)) { stack.length = i; return; }
    }
  };
  const re = /<!--[\s\S]*?-->|<![^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>|[^<]+|</g;
  let m;
  while ((m = re.exec(html))) {
    const [tok, endTag, startTag, attrStr = '', selfClose] = m;
    if (tok.startsWith('<!')) continue;
    if (endTag) {
      const t = endTag.toLowerCase();
      const i = stack.map((n) => n.tag).lastIndexOf(t);
      if (i > 0) stack.length = i;
      continue;
    }
    if (startTag) {
      const t = startTag.toLowerCase();
      if (t === 'script' || t === 'style') {
        const close = html.toLowerCase().indexOf(`</${t}`, re.lastIndex);
        re.lastIndex = close < 0 ? html.length : html.indexOf('>', close) + 1;
        continue;
      }
      if (MD_BLOCK.has(t) && top().tag === 'p') stack.pop();
      if (t === 'li') closeTo(['li'], ['ul', 'ol']);
      if (t === 'tr') closeTo(['tr'], ['table']);
      if (t === 'td' || t === 'th') closeTo(['td', 'th'], ['tr', 'table']);
      const attrs = {};
      for (const a of attrStr.matchAll(/([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
      const node = { tag: t, attrs, children: [] };
      top().children.push(node);
      if (!VOID_TAGS.has(t) && !selfClose) stack.push(node);
      continue;
    }
    top().children.push({ text: decodeEntities(tok) });
  }
  return root;
}

const tidy = (s) =>
  s
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
const wrap = (s, mark) => {
  if (!s.trim()) return s;
  const lead = s.match(/^\s*/)[0];
  const trail = s.match(/\s*$/)[0];
  return `${lead}${mark}${s.trim()}${mark}${trail}`;
};
const mdLink = (text, href) => `[${oneLine(text).replace(/([[\]])/g, '\\$1')}](${href.trim().replace(/\s/g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29')})`;

function toMd(node, depth = 0) {
  if (node.text !== undefined) return node.text.replace(/\s+/g, ' ');
  const inner = () => node.children.map((c) => toMd(c, depth)).join('');
  const t = node.tag;
  if (/^h[1-6]$/.test(t)) {
    const text = oneLine(inner());
    return text ? `\n\n${'#'.repeat(Math.min(6, Math.max(3, Number(t[1]) + 1)))} ${text.replace(/^\*\*(.*)\*\*$/, '$1')}\n\n` : '';
  }
  switch (t) {
    case 'br':
      return '\n';
    case 'hr':
      return '\n\n---\n\n';
    case 'strong':
    case 'b':
      return wrap(inner(), '**');
    case 'em':
    case 'i':
      return wrap(inner(), '*');
    case 'code':
      return wrap(inner(), '`');
    case 'a': {
      const text = inner();
      const href = node.attrs.href || '';
      if (/^mailto:/i.test(href)) return /@/.test(text) ? '' : text;
      return /^https?:\/\//i.test(href) && text.trim() ? mdLink(text, href) : text;
    }
    case 'img':
      return /^https?:\/\//i.test(node.attrs.src || '') ? `![${oneLine(node.attrs.alt || '')}](${node.attrs.src.trim()})` : '';
    case 'ul':
    case 'ol': {
      const items = node.children.filter((c) => c.tag === 'li');
      const lines = items.map((li, i) => {
        const prefix = t === 'ol' ? `${i + 1}. ` : '- ';
        const body = tidy(toMd(li, depth + 1)).replace(/\n+/g, '\n');
        return prefix + body.split('\n').map((l, j) => (j ? ' '.repeat(prefix.length) + l : l)).join('\n');
      });
      return `\n\n${lines.join('\n')}\n\n`;
    }
    case 'blockquote':
      return `\n\n${tidy(inner()).split('\n').map((l) => `> ${l}`).join('\n')}\n\n`;
    case 'table':
      return `\n\n${mdTable(node)}\n\n`;
    case 'pre':
      return `\n\n\`\`\`\n${textOf(node)}\n\`\`\`\n\n`;
    default:
      return MD_BLOCK.has(t) ? `\n\n${inner()}\n\n` : inner();
  }
}

const textOf = (node) => (node.text !== undefined ? node.text : node.children.map(textOf).join(''));

function mdTable(table) {
  const rows = [];
  const walk = (n) => {
    for (const c of n.children || []) {
      if (c.tag === 'tr') rows.push(c.children.filter((x) => x.tag === 'td' || x.tag === 'th').map((cell) => oneLine(tidy(toMd(cell))).replace(/\|/g, '\\|')));
      else if (c.tag && c.tag !== 'table') walk(c);
    }
  };
  walk(table);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const line = (r) => `| ${Array.from({ length: width }, (_, i) => r[i] || '').join(' | ')} |`;
  return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n');
}

// Contact details are left out of the copies: e-mail addresses and phone numbers.
const scrubContacts = (md) =>
  md
    .replace(/(^|[^\w/@.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '$1')
    .replace(/(^|[^\w])(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)/g, '$1');

const htmlToMarkdown = (html) => scrubContacts(tidy(toMd(parseHtml(String(html || '')))));

function frontMatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length) && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

function markdownDoc(fields, title, body) {
  return `${frontMatter(fields)}\n# ${title}\n\n${scrubContacts(tidy(body))}\n`;
}

function headTags({ title, description, canonical, markdown, image, imageAlt, type = 'website', jsonld }) {
  const lines = [
    `<title>${escapeText(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}">`,
    `<link rel="canonical" href="${escapeAttr(canonical)}">`,
    `<link rel="alternate" type="text/markdown" href="${escapeAttr(markdown)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">`,
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:description" content="${escapeAttr(description)}">`,
    `<meta property="og:image" content="${escapeAttr(image)}">`,
    `<meta property="og:image:alt" content="${escapeAttr(imageAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeAttr(title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(description)}">`,
    `<meta name="twitter:image" content="${escapeAttr(image)}">`,
    `<script type="application/ld+json">${safeJson(jsonld)}</script>`,
  ];
  return lines.join('\n    ');
}

// Removes the page's own title/description/canonical/og/twitter tags and puts `tags` where the
// <title> was.
function replaceHead(page, tags) {
  const headEnd = page.search(/<\/head>/i);
  if (headEnd < 0) throw new Error('No </head>');
  let head = page.slice(0, headEnd);
  const titleAt = head.search(/<title>/i);
  if (titleAt < 0) throw new Error('No <title>');
  head = head.slice(0, titleAt) + '\u0000' + head.slice(titleAt).replace(/<title>[\s\S]*?<\/title>/i, '');
  head = head.replace(/[ \t]*<meta\b[^>]*>[ \t]*\r?\n?/gi, (tag) =>
    /\b(property|name)=["'](og:|twitter:|description["'])/i.test(tag) ? '' : tag,
  );
  head = head.replace(/[ \t]*<link\b[^>]*rel=["']canonical["'][^>]*>[ \t]*\r?\n?/gi, '');
  return head.replace('\u0000', tags) + page.slice(headEnd);
}

function writeOut(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.rmSync(file, { force: true });
  fs.writeFileSync(file, content);
}

// Copies the site into OUT the way Netlify published the repo root before: everything except
// dot-files, node_modules and the output folder itself.
function copySite(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (path.resolve(from) === OUT) continue;
    if (entry.isDirectory()) copySite(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to, fs.constants.COPYFILE_FICLONE);
  }
}

// ---------------------------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------------------------
function load(name) {
  const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name), 'utf8'));
  return json && json.data !== undefined ? json.data : json;
}
const pick = (o, keys) => (o && typeof o === 'object' ? Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]])) : o);
const file = (f) => (f && f.filename_disk ? { filename_disk: f.filename_disk } : f);
const youtube = (id) => ({ watch: `https://www.youtube.com/watch?v=${id}`, embed: `https://www.youtube.com/embed/${id}`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });

// ---------------------------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------------------------
// Only the fields lectures/index.html reads, so the inline JSON stays small.
function lectureData(l) {
  return {
    slug: l.slug,
    title: l.title,
    description: l.description,
    video_url_identifier: l.video_url_identifier,
    lecture_transcript: l.lecture_transcript ? { data: { full_url: l.lecture_transcript.data && l.lecture_transcript.data.full_url } } : l.lecture_transcript,
    faculty: (l.faculty || []).map((f) => ({ faculty_junction_id: pick(f.faculty_junction_id, ['name']) })),
    readings: (l.readings || []).map((r) => ({ reading_junction_id: pick(r.reading_junction_id, ['title', 'citation', 'source_link']) })),
  };
}

const lecturers = (l) => (l.faculty || []).map((f) => f.faculty_junction_id).filter((f) => f && f.name);
const transcriptUrl = (l) => {
  const u = l.lecture_transcript && l.lecture_transcript.data && l.lecture_transcript.data.full_url;
  return u ? new URL(u, SITE).href : null;
};

function lectureJsonLd(l, canonical, description, image) {
  const video = youtube(l.video_url_identifier);
  const lecture = {
    '@type': 'LearningResource',
    '@id': `${canonical}#lecture`,
    name: l.title,
    description: plainText(l.description) || description,
    url: canonical,
    learningResourceType: 'Lecture',
    inLanguage: 'en',
    isAccessibleForFree: true,
    license: LICENSE,
    image,
    isPartOf: { '@id': COURSE['@id'] },
    provider: { '@id': GOVLAB['@id'] },
    author: lecturers(l).map((f) => {
      const person = { '@type': 'Person', name: f.name };
      if (f.title) person.jobTitle = oneLine(plainText(f.title));
      if (f.organization) person.affiliation = { '@type': 'Organization', name: oneLine(plainText(f.organization)) };
      return person;
    }),
    citation: (l.readings || [])
      .map((r) => r.reading_junction_id)
      .filter((r) => r && r.title)
      .map((r) => {
        const work = { '@type': 'CreativeWork', name: plainText(r.title) };
        if (/^https?:\/\//.test(r.source_link || '')) work.url = r.source_link.trim();
        if (r.citation) work.description = plainText(r.citation);
        return work;
      }),
  };
  const keywords = (l.tags || []).filter((t) => typeof t === 'string' && t.trim());
  if (keywords.length) lecture.keywords = keywords.join(', ');
  if (l.video_url_identifier) {
    // No upload date is known, so this does not qualify for Google's video rich results.
    lecture.video = { '@type': 'VideoObject', name: l.title, description: plainText(l.short_description || l.description) || description, embedUrl: video.embed, url: video.watch, thumbnailUrl: video.thumb };
  }
  const transcript = transcriptUrl(l);
  if (transcript) lecture.associatedMedia = { '@type': 'MediaObject', name: `Transcript: ${l.title}`, contentUrl: transcript, encodingFormat: 'application/pdf' };
  const page = { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: `${l.title} | ${SITE_NAME}`, description, inLanguage: 'en', license: LICENSE, isPartOf: { '@id': WEBSITE['@id'] }, mainEntity: { '@id': lecture['@id'] }, breadcrumb: { '@id': `${canonical}#breadcrumb` } };
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Modules', item: `${SITE}/modules` },
      { '@type': 'ListItem', position: 2, name: l.title, item: canonical },
    ],
  };
  return { '@context': 'https://schema.org', '@graph': [page, lecture, breadcrumb, COURSE, WEBSITE, GOVLAB] };
}

function lectureMarkdown(l, canonical, summary) {
  const parts = [`A lecture of the course [${SITE_NAME}](${SITE}/).`];
  const people = lecturers(l).map((f) => `- ${[f.name, f.title, f.organization].filter(Boolean).map((x) => oneLine(plainText(x))).join(', ')}`);
  if (people.length) parts.push(`## ${people.length > 1 ? 'Lecturers' : 'Lecturer'}\n\n${people.join('\n')}`);
  const about = htmlToMarkdown(l.description);
  if (about) parts.push(`## About this lecture\n\n${about}`);
  const media = [];
  if (l.video_url_identifier) media.push(`- Video: ${mdLink(youtube(l.video_url_identifier).watch, youtube(l.video_url_identifier).watch)}`);
  if (transcriptUrl(l)) media.push(`- Transcript (PDF): ${mdLink(transcriptUrl(l), transcriptUrl(l))}`);
  if (media.length) parts.push(`## Video and transcript\n\n${media.join('\n')}`);
  const readings = (l.readings || [])
    .map((r) => r.reading_junction_id)
    .filter((r) => r && r.title)
    .map((r) => {
      const title = oneLine(plainText(r.title));
      const head = /^https?:\/\//.test(r.source_link || '') ? mdLink(title, r.source_link) : title;
      return `- ${head}${r.citation ? `, ${oneLine(plainText(r.citation))}` : ''}`;
    });
  if (readings.length) parts.push(`## Read, watch, and listen\n\n${readings.join('\n')}`);
  return markdownDoc(
    { id: `aiethics:lecture/${l.slug}`, type: 'AI Ethics course lecture', title: l.title, url: canonical, authors: lecturers(l).map((f) => f.name), summary, source: SOURCE, licence: FOOTER_LICENCE },
    l.title,
    parts.join('\n\n'),
  );
}

function renderLecture(shell, l) {
  const data = [lectureData(l)];
  // Netlify answers a path with capitals with a 301 to the lower-case path, so that is the address.
  const canonical = `${SITE}/lectures/${l.slug.toLowerCase()}`;
  const markdown = `${canonical}.md`;
  const description = truncate(plainText(l.short_description) || plainText(l.description) || `${l.title}, a lecture of ${SITE_NAME}.`);
  const image = l.icon && l.icon.filename_disk && fs.existsSync(path.join(ROOT, 'img', l.icon.filename_disk)) ? `${SITE}/img/${l.icon.filename_disk}` : SITE_IMAGE;
  const scope = { lectureData: data, dataPath: '/data/', loading: false, error: null };
  let page = prerenderRoot(shell, { rootId: 'home-page', templateId: 'lecture-tpl', dataId: 'lecture-data', scope, data });
  page = replaceHead(page, headTags({ title: `${l.title} | ${SITE_NAME}`, description, canonical, markdown, image, imageAlt: l.title, jsonld: lectureJsonLd(l, canonical, description, image) }));
  return {
    html: page,
    doc: { file: `lectures/${l.slug}.md`, url: canonical, markdown, title: l.title, summary: truncate(description, 200), text: lectureMarkdown(l, canonical, description) },
  };
}

// ---------------------------------------------------------------------------------------------
// Webinar series
// ---------------------------------------------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// moment(date).format("LL") for the YYYY-MM-DD dates in data/instructor_panel.json.
function dateShow(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));
  if (!m) throw new Error(`unexpected date ${JSON.stringify(date)}`);
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}
// moment().tz("America/Toronto").format('YYYY-MM-DD'), as the page computes it.
const torontoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function webinarPageData(slug, webinars, events, intro, supporters) {
  return {
    slugData: slug,
    webinarData: webinars.map((w) => ({ ...pick(w, ['slug', 'title', 'description', 'organizer']), thumbnail: file(w.thumbnail) })),
    eventsData: events.map((e) => ({
      ...pick(e, ['title', 'date', 'series', 'video_link', 'blog_link']),
      thumbnail: file(e.thumbnail),
      panelists: e.panelists ? e.panelists.map((p) => ({ people_id: pick(p.people_id, ['slug', 'name']) })) : e.panelists,
    })),
    indexData: intro.map((i) => pick(i, ['partner_section_text'])),
    supporterData: supporters.map((s) => ({ url: s.url, logo: file(s.logo) })),
  };
}

// Panelists in data/instructor_panel.json are people ids; the page cannot show their names, but
// the Markdown copy and JSON-LD resolve them through data/people.json.
let PEOPLE = new Map();
const panelistNames = (e) =>
  (e.panelists || [])
    .map((p) => p.people_id)
    .map((x) => (x && typeof x === 'object' ? x.name : PEOPLE.get(x)))
    .filter(Boolean);

const pastEvents = (data, slug, today) => data.eventsData.filter((e) => e.date < today && e.series == slug);

function webinarJsonLd(w, data, canonical, description, image, today) {
  const series = {
    '@type': 'EventSeries',
    '@id': `${canonical}#series`,
    name: w.title,
    description: plainText(w.description) || description,
    url: canonical,
    image,
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    subEvent: pastEvents(data, w.slug, today).map((e) => {
      const ev = { '@type': 'Event', name: e.title, startDate: e.date, eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'VirtualLocation', url: e.video_link || canonical } };
      const people = panelistNames(e);
      if (people.length) ev.performer = people.map((name) => ({ '@type': 'Person', name }));
      if (/^https?:\/\//.test(e.video_link || '')) ev.recordedIn = { '@type': 'CreativeWork', name: `Recording: ${e.title}`, url: e.video_link };
      return ev;
    }),
  };
  if (w.organizer) series.organizer = { '@type': 'Organization', name: w.organizer };
  const page = { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: `${w.title} | ${SITE_NAME}`, description, inLanguage: 'en', license: LICENSE, isPartOf: { '@id': WEBSITE['@id'] }, mainEntity: { '@id': series['@id'] } };
  return { '@context': 'https://schema.org', '@graph': [page, series, WEBSITE, GOVLAB] };
}

function webinarMarkdown(w, data, canonical, summary, today) {
  const parts = [`A webinar series of the course [${SITE_NAME}](${SITE}/).`];
  if (w.organizer) parts.push(`Organised by ${oneLine(w.organizer)}.`);
  const about = htmlToMarkdown(w.description);
  if (about) parts.push(about);
  const events = pastEvents(data, w.slug, today).map((e) => {
    const lines = [`### ${oneLine(e.title)}`, '', `- Date: ${dateShow(e.date)}`];
    const people = panelistNames(e);
    if (people.length) lines.push(`- Panelists: ${people.join(', ')}`);
    if (/^https?:\/\//.test(e.video_link || '')) lines.push(`- Video: ${mdLink(e.video_link, e.video_link)}`);
    if (/^https?:\/\//.test(e.blog_link || '')) lines.push(`- Blog post: ${mdLink(e.blog_link, e.blog_link)}`);
    return lines.join('\n');
  });
  if (events.length) parts.push(`## Recorded panels\n\n${events.join('\n\n')}`);
  return markdownDoc({ id: `aiethics:webinar/${w.slug}`, type: 'AI Ethics course webinar series', title: w.title, url: canonical, summary, source: SOURCE, licence: FOOTER_LICENCE }, w.title, parts.join('\n\n'));
}

function renderWebinar(shell, w, data, today) {
  const canonical = `${SITE}/webinars/${w.slug.toLowerCase()}`;
  const markdown = `${canonical}.md`;
  const description = truncate(plainText(w.description) || `${w.title}, a webinar series of ${SITE_NAME}.`);
  const image = w.thumbnail && w.thumbnail.filename_disk && fs.existsSync(path.join(ROOT, 'img', w.thumbnail.filename_disk)) ? `${SITE}/img/${w.thumbnail.filename_disk}` : SITE_IMAGE;
  const scope = { ...data, currentDate: today, dataPath: '/data/', dateShow };
  let page = prerenderRoot(shell, { rootId: 'home-page', templateId: 'webinar-tpl', dataId: 'webinar-data', scope, data });
  page = replaceHead(page, headTags({ title: `${w.title} | ${SITE_NAME}`, description, canonical, markdown, image, imageAlt: w.title, jsonld: webinarJsonLd(w, data, canonical, description, image, today) }));
  return {
    html: page,
    doc: { file: `webinars/${w.slug}.md`, url: canonical, markdown, title: w.title, summary: truncate(description, 200), text: webinarMarkdown(w, data, canonical, description, today) },
  };
}

// ---------------------------------------------------------------------------------------------
// Sitemap, llms.txt, llms-full.txt, _headers
// ---------------------------------------------------------------------------------------------
const STATIC_PAGES = ['/', '/modules', '/instructors', '/instructor-panels', '/webinar-series', '/partners'];

function sitemap(entries) {
  const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const urls = entries.map((e) => `  <url><loc>${xmlEscape(e.loc)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const LLMS_INTRO = `> ${COURSE_DESCRIPTION} The course, from The GovLab, is made of recorded lectures with readings and transcripts, plus webinar series with recorded panels.`;

function llmsTxt(docs) {
  const items = docs.map((d) => `- [${d.title.replace(/([[\]])/g, '\\$1')}](${d.markdown}): ${oneLine(d.summary)}`);
  return `# ${SITE_NAME}\n\n${LLMS_INTRO}\n\n## Pages\n\n${items.join('\n')}\n`;
}

function llmsFullTxt(docs) {
  return `# ${SITE_NAME}\n\n${LLMS_INTRO}\n\nThe full text of every page listed in ${SITE}/llms.txt follows, one Markdown document per page.\n\n${docs.map((d) => d.text).join('\n')}`;
}

function headersFile(docs) {
  const existing = fs.existsSync(path.join(ROOT, '_headers')) ? `${fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').trimEnd()}\n\n` : '';
  const block = (p, lines) => `${p}\n${lines.map((l) => `  ${l}`).join('\n')}`;
  return `${existing}${[
    block('/llms.txt', ['Content-Type: text/plain; charset=utf-8']),
    block('/llms-full.txt', ['Content-Type: text/markdown; charset=utf-8']),
    ...docs.map((d) => block(`/${d.file}`, ['Content-Type: text/markdown; charset=utf-8', `Link: <${d.url}>; rel="canonical"`])),
  ].join('\n\n')}\n`;
}

// ---------------------------------------------------------------------------------------------
function main() {
  const started = Date.now();
  fs.rmSync(OUT, { recursive: true, force: true });
  copySite(ROOT, OUT);
  const slugOk = (s) => /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(s || '') && s !== 'index';
  const entries = STATIC_PAGES.map((p) => ({ loc: `${SITE}${p}` }));
  const docs = [];

  const lectureShell = fs.readFileSync(path.join(ROOT, 'lectures/index.html'), 'utf8');
  const lectures = load('lecture.json').filter((l) => l.status === 'published' && slugOk(l.slug)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (const l of lectures) {
    try {
      const { html, doc } = renderLecture(lectureShell, l);
      writeOut(`lectures/${l.slug}.html`, html);
      writeOut(doc.file, doc.text);
      entries.push({ loc: doc.url });
      docs.push(doc);
    } catch (err) {
      console.warn(`lecture ${l.slug}: not pre-rendered (${err.message})`);
    }
  }
  const lectureCount = docs.length;

  const webinarShell = fs.readFileSync(path.join(ROOT, 'webinars/index.html'), 'utf8');
  const webinars = load('webinars.json').filter((w) => w.status === 'published' && slugOk(w.slug));
  const events = load('instructor_panel.json');
  const intro = load('intro_elements.json');
  const supporters = load('supporters.json');
  PEOPLE = new Map(load('people.json').map((p) => [p.id, p.name]));
  const today = torontoToday();
  for (const w of webinars) {
    try {
      const data = webinarPageData(w.slug, webinars, events, intro, supporters);
      const { html, doc } = renderWebinar(webinarShell, w, data, today);
      writeOut(`webinars/${w.slug}.html`, html);
      writeOut(doc.file, doc.text);
      entries.push({ loc: doc.url });
      docs.push(doc);
    } catch (err) {
      console.warn(`webinar ${w.slug}: not pre-rendered (${err.message})`);
    }
  }

  writeOut('sitemap.xml', sitemap(entries));
  writeOut('llms.txt', llmsTxt(docs));
  writeOut('llms-full.txt', llmsFullTxt(docs));
  writeOut('_headers', headersFile(docs));
  console.log(`prerender: ${lectureCount}/${lectures.length} lectures, ${docs.length - lectureCount}/${webinars.length} webinar series, ${docs.length} Markdown copies, ${entries.length} sitemap URLs, ${((Date.now() - started) / 1000).toFixed(1)}s -> ${path.relative(ROOT, OUT) || '.'}`);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

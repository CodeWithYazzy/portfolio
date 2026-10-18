// ==========================================
// GITHUB DEMO RUNNER
// Inspects a real GitHub repository, detects its project type and,
// when genuinely possible, executes it inside a sandboxed iframe.
// Static HTML/CSS/JS  -> fetched + rewritten + rendered (real code)
// Vite/React/Next     -> committed build served if present, else honest "live build required"
// Node/Python backend -> honest explanation, never faked
// ==========================================
(function (global) {
  'use strict';

  const API_BASE = 'https://api.github.com';
  const RAW_BASE = 'https://raw.githubusercontent.com';
  const GH_HEADERS = { 'Accept': 'application/vnd.github+json' };

  const LIMITS = {
    maxFileBytes: 5 * 1024 * 1024,
    maxTotalBytes: 25 * 1024 * 1024,
    maxFiles: 300,
    maxImportDepth: 5,
    maxSubPages: 12,
    maxAnchorHtmlBytes: 2 * 1024 * 1024,
    maxMetadataBytes: 2 * 1024 * 1024,
    fetchTimeoutMs: 20000
  };

  const MIME = {
    html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript',
    mjs: 'text/javascript', json: 'application/json', map: 'application/json',
    svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', ico: 'image/x-icon',
    bmp: 'image/bmp', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf',
    otf: 'font/otf', eot: 'application/vnd.ms-fontobject', mp3: 'audio/mpeg',
    wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm',
    txt: 'text/plain', xml: 'application/xml'
  };

  const BINARY_EXT = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'bmp', 'woff', 'woff2',
    'ttf', 'otf', 'eot', 'mp3', 'wav', 'ogg', 'mp4', 'webm'
  ]);

  // ------------------------------------------
  // Errors & friendly messages
  // ------------------------------------------
  class DemoError extends Error {
    constructor(code, title, detail) {
      super(title);
      this.name = 'DemoError';
      this.code = code;
      this.title = title;
      this.detail = detail || '';
    }
  }

  function friendlyError(err) {
    if (err instanceof DemoError) return { title: err.title, detail: err.detail };
    return { title: 'Unexpected error', detail: String((err && err.message) || err) };
  }

  async function ghFetch(url, maxBytes = LIMITS.maxMetadataBytes) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIMITS.fetchTimeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: GH_HEADERS, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!res.ok) {
        if (res.status === 404) throw new DemoError('NOT_FOUND', 'Not found on GitHub', 'The public repository, branch, or file could not be found.');
        if (res.status === 403 || res.status === 429) throw new DemoError('RATE_LIMIT', 'GitHub request unavailable', 'GitHub may have rate limited this request. Wait before trying again.');
        throw new DemoError('HTTP_' + res.status, `GitHub returned HTTP ${res.status}`, 'Try again later or open the source on GitHub.');
      }
      if (Number(res.headers.get('Content-Length')) > maxBytes) {
        controller.abort();
        throw new DemoError('FILE_TOO_LARGE', 'Response too large to load', 'This response exceeds the browser preview size limit.');
      }
      const reader = res.body.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          throw new DemoError('FILE_TOO_LARGE', 'Response too large to load', 'This response exceeds the browser preview size limit.');
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { bytes, json: () => JSON.parse(new TextDecoder().decode(bytes)) };
    } catch (err) {
      if (err instanceof DemoError) throw err;
      if (err && err.name === 'AbortError') {
        throw new DemoError('TIMEOUT', 'Request timed out',
          `GitHub did not respond in time.\n\nURL: ${url}`);
      }
      throw new DemoError('NETWORK', 'Network or CORS error',
        `The request to GitHub could not be completed.\n\nURL: ${url}\n${(err && err.message) || ''}`.trim());
    } finally {
      clearTimeout(timer);
    }
  }

  // ------------------------------------------
  // Cache (metadata / tree / files)
  // ------------------------------------------
  const cache = { repo: new Map(), tree: new Map(), file: new Map() };
  let cachedFileBytes = 0;

  function clearCache() {
    cache.repo.clear();
    cache.tree.clear();
    cache.file.clear();
    cachedFileBytes = 0;
  }

  // ------------------------------------------
  // URL parsing & path helpers
  // ------------------------------------------
  function parseGithubUrl(url) {
    let parsed;
    try {
      parsed = new URL(String(url || ''), 'https://example.invalid');
    } catch (e) {
      return null;
    }
    if (parsed.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(parsed.hostname.toLowerCase()) || parsed.username || parsed.password || parsed.port) return null;
    let segments;
    try { segments = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch (_) { return null; }
    if (segments.some(part => !part || /[\\/\u0000-\u0020\u007f]/.test(part) || part === '.' || part === '..')) return null;
    if (segments.length < 2) return null;
    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, '');
    if (!validRepo(owner, repo)) return null;
    if (segments.length > 2 && !['tree', 'blob'].includes(segments[2])) return null;
    if (segments.length === 3) return null;
    let branch = null;
    let subdir = '';
    let filePath = '';
    if (segments.length >= 4 && ['tree', 'blob'].includes(segments[2])) {
      branch = segments[3];
      const rest = segments.slice(4);
      if (segments[2] === 'tree') subdir = rest.join('/');
      else filePath = rest.join('/');
    }
    return { owner, repo, branch, subdir: subdir.replace(/\/+$/, ''), filePath };
  }

  function validRepo(owner, repo) {
    return /^[a-z0-9][a-z0-9-]{0,38}$/i.test(owner) && /^[a-z0-9_.-]{1,100}$/i.test(repo) && repo !== '.' && repo !== '..';
  }

  function assertGithubPath(owner, repo, branch, path = '') {
    if (!validRepo(owner, repo) || (branch !== undefined && (!branch || /[\u0000-\u0020\u007f\\?#]/.test(branch) || branch.split('/').some(p => !p || p === '.' || p === '..'))) || /[\u0000-\u001f\u007f\\?#]/.test(path) || path.split('/').some(p => p === '.' || p === '..')) {
      throw new DemoError('INVALID_PATH', 'Invalid GitHub location', 'Use a public HTTPS GitHub repository and a path within that repository.');
    }
  }

  function safeHttpsUrl(value) {
    try {
      const url = new URL(String(value));
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }

  function normalizeDir(p) {
    p = String(p || '').replace(/\\/g, '/').replace(/^\.?\//, '');
    return p ? p.replace(/\/+$/, '') + '/' : '';
  }

  function dirname(p) {
    const i = String(p).lastIndexOf('/');
    return i === -1 ? '' : String(p).slice(0, i + 1);
  }

  function resolvePath(baseDir, relative) {
    let ref;
    try { ref = decodeURIComponent(String(relative).split(/[?#]/)[0]); } catch (_) { return ''; }
    if (/[\\\u0000-\u001f\u007f]/.test(ref)) return '';
    const combined = (ref.startsWith('/') ? '' : normalizeDir(baseDir)) + ref;
    const out = [];
    for (const part of combined.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') { if (!out.length) return ''; out.pop(); continue; }
      out.push(part);
    }
    return out.join('/');
  }

  function isExternal(ref) {
    return !ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref.trim());
  }

  function scopePaths(paths, subdir) {
    const prefix = normalizeDir(subdir);
    if (!prefix) return paths.slice();
    return paths.filter(p => p.startsWith(prefix)).map(p => p.slice(prefix.length));
  }

  function extOf(path) {
    const m = /\.([a-z0-9]+)$/i.exec(path);
    return m ? m[1].toLowerCase() : '';
  }

  function mimeOf(path) {
    return MIME[extOf(path)] || 'application/octet-stream';
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function utf8ToBase64(text) {
    return bytesToBase64(new TextEncoder().encode(text));
  }

  function dataUrlFor(entry, path) {
    return `data:${mimeOf(path)};base64,${bytesToBase64(entry.bytes)}`;
  }

  // ------------------------------------------
  // GitHub API functions
  // ------------------------------------------
  async function fetchGithubRepo(owner, repo, options = {}) {
    assertGithubPath(owner, repo);
    const key = `${owner}/${repo}`;
    if (!options.force && cache.repo.has(key)) return cache.repo.get(key);
    const res = await ghFetch(`${API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    const data = await res.json();
    cache.repo.set(key, data);
    if (cache.repo.size > 20) cache.repo.delete(cache.repo.keys().next().value);
    return data;
  }

  async function getDefaultBranch(owner, repo, options = {}) {
    try {
      const meta = await fetchGithubRepo(owner, repo, options);
      return meta.default_branch || 'main';
    } catch (err) {
      if (err instanceof DemoError && err.code === 'RATE_LIMIT') {
        console.warn('[demo-runner] Rate limited reading metadata; guessing default branch "main".');
        return 'main';
      }
      throw err;
    }
  }

  async function getRepoTree(owner, repo, branch, options = {}) {
    assertGithubPath(owner, repo, branch);
    const key = `${owner}/${repo}@${branch}`;
    if (!options.force && cache.tree.has(key)) return cache.tree.get(key);
    const encodedBranch = String(branch).split('/').map(encodeURIComponent).join('/');
    const res = await ghFetch(`${API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodedBranch}?recursive=1`);
    const data = await res.json();
    if (data.truncated) {
      throw new DemoError('TRUNCATED', 'Repository too large',
        'The repository file tree is too large for GitHub to enumerate in one request, so the demo runner cannot safely inspect it.');
    }
    const paths = (Array.isArray(data.tree) ? data.tree : []).filter(node => node.type === 'blob' && typeof node.path === 'string').map(node => node.path);
    if (paths.length > LIMITS.maxFiles) {
      throw new DemoError('TOO_MANY_FILES', 'Repository has too many files',
        `This repository contains ${paths.length} files; the in-browser runner inspects at most ${LIMITS.maxFiles}.`);
    }
    cache.tree.set(key, paths);
    if (cache.tree.size > 20) cache.tree.delete(cache.tree.keys().next().value);
    return paths;
  }

  async function fetchGithubFile(owner, repo, branch, filePath, options = {}) {
    assertGithubPath(owner, repo, branch, filePath);
    const binary = !!options.binary;
    const key = `${owner}/${repo}@${branch}/${filePath}:${binary ? 'b' : 't'}`;
    if (!options.force && cache.file.has(key)) return cache.file.get(key);
    const url = [
      RAW_BASE,
      encodeURIComponent(owner),
      encodeURIComponent(repo),
      String(branch).split('/').map(encodeURIComponent).join('/'),
      filePath.split('/').map(encodeURIComponent).join('/')
    ].join('/');
    const res = await ghFetch(url, Math.min(options.maxBytes || LIMITS.maxFileBytes, LIMITS.maxFileBytes));
    const buffer = res.bytes;
    if (buffer.length > LIMITS.maxFileBytes) {
      throw new DemoError('FILE_TOO_LARGE', 'File too large to load',
        `${filePath} is ${(buffer.length / 1048576).toFixed(1)} MB; the in-browser limit is ${Math.round(LIMITS.maxFileBytes / 1048576)} MB.`);
    }
    const entry = { bytes: buffer, text: binary ? null : new TextDecoder('utf-8').decode(buffer) };
    if (cache.file.has(key)) cachedFileBytes -= cache.file.get(key).bytes.length;
    cache.file.delete(key);
    while (cache.file.size && cachedFileBytes + buffer.length > LIMITS.maxTotalBytes) {
      const oldest = cache.file.keys().next().value;
      cachedFileBytes -= cache.file.get(oldest).bytes.length;
      cache.file.delete(oldest);
    }
    cache.file.set(key, entry);
    cachedFileBytes += buffer.length;
    return entry;
  }

  // ------------------------------------------
  // Project type detection
  // ------------------------------------------
  function detectProjectType(paths, packageJsonText) {
    const set = new Set(paths);
    let pkg = null;
    if (typeof packageJsonText === 'string' && packageJsonText.trim()) {
      try { pkg = JSON.parse(packageJsonText); } catch (e) { pkg = { __malformed: true }; }
    }
    const deps = pkg && !pkg.__malformed
      ? { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      : {};

    if (pkg && !pkg.__malformed) {
      if (deps.next) return { type: 'C', label: 'Next.js (React framework)', framework: 'next' };
      if (deps.vite || deps['@vitejs/plugin-react'] || deps['@vitejs/plugin-vue']) {
        const label = deps.react ? 'Vite + React frontend' : deps.vue ? 'Vite + Vue frontend' : 'Vite frontend';
        return { type: 'B', label, framework: 'vite' };
      }
      if (deps['react-scripts']) return { type: 'B', label: 'Create React App frontend', framework: 'cra' };
      if (deps.parcel) return { type: 'B', label: 'Parcel frontend', framework: 'parcel' };
      if (deps.webpack && (deps.react || deps['react-dom'] || deps.vue)) {
        return { type: 'B', label: 'Webpack SPA frontend', framework: 'webpack' };
      }
      if (deps.express || deps.fastify || deps.koa || deps.nestjs || deps.hapi) {
        return { type: 'D', label: 'Node.js server application', framework: 'node-server' };
      }
      return { type: 'D', label: 'Node.js project (package.json)', framework: 'node-generic' };
    }

    if (set.has('requirements.txt') || set.has('pyproject.toml') || set.has('setup.py') ||
        set.has('Pipfile') || paths.some(p => p.toLowerCase().endsWith('.py') && !/^(tests?|tools|scripts)\//i.test(p))) {
      return { type: 'E', label: 'Python project', framework: 'python' };
    }

    const entryCandidates = ['', 'docs/', 'public/', 'dist/', 'build/', 'out/']
      .filter(dir => set.has(dir + 'index.html'));
    if (entryCandidates.length) {
      return { type: 'A', label: 'Static HTML/CSS/JavaScript', framework: 'static', entryDir: entryCandidates[0] };
    }

    if (paths.length <= 3 && paths.every(p => /\.(md|txt|license)$/i.test(p))) {
      return { type: 'F', label: 'Documentation-only repository', framework: 'none' };
    }
    return { type: 'F', label: 'Unsupported project layout', framework: 'none' };
  }

  function findCommittedBuild(scopedPaths) {
    for (const dir of ['dist/', 'build/', 'out/', 'docs/']) {
      if (scopedPaths.includes(dir + 'index.html')) return dir;
    }
    return null;
  }

  // ------------------------------------------
  // CSS rewriting: @import inlining + url(...) -> data URLs
  // ------------------------------------------
  function rewriteCss(cssText, cssDir, ctx, imports = []) {
    if (imports.length > LIMITS.maxImportDepth) {
      throw new DemoError('IMPORT_DEPTH', 'Stylesheets nested too deeply', 'The preview limits nested stylesheet imports.');
    }
    let result = cssText.replace(
      /@import\s+(?:url\(\s*)?(['"]?)([^'")\s]+)\1\s*\)?[^;]*;/gi,
      (match, quote, target) => {
        if (isExternal(target)) return match;
        const importPath = resolvePath(cssDir, target);
        if (imports.includes(importPath)) {
          ctx.warnings.push(`Circular stylesheet import omitted: ${importPath}`);
          return '';
        }
        const imported = ctx.fs.get(importPath);
        if (!imported) {
          ctx.warnings.push(`CSS @import target not preloaded: ${importPath}`);
          return match;
        }
        const content = rewriteCss(imported.text, dirname(importPath), ctx, [...imports, importPath]);
        const condition = match.replace(/^@import\s+(?:url\(\s*)?(['"]?)[^'")\s]+\1\s*\)?/i, '').replace(/;$/, '').trim();
        return condition ? `@media ${condition}{${content}}` : content;
      }
    );
    result = result.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, target) => {
      const trimmed = target.trim();
      if (isExternal(trimmed)) return match;
      const assetPath = resolvePath(cssDir, trimmed);
      const entry = ctx.fs.get(assetPath);
      if (!entry) {
        ctx.missing.push(assetPath);
        return match;
      }
      const fragment = trimmed.includes('#') ? '#' + trimmed.split('#').slice(1).join('#') : '';
      return `url("${dataUrlFor(entry, assetPath)}${fragment}")`;
    });
    return result;
  }

  // ------------------------------------------
  // ES module specifier rewriting -> data: URL imports
  // ------------------------------------------
  function transformModuleSource(code, moduleDir, ctx, depth) {
    if (depth > LIMITS.maxImportDepth) {
      throw new DemoError('IMPORT_DEPTH', 'Module imports nested too deeply',
        `More than ${LIMITS.maxImportDepth} levels of relative ES-module imports.`);
    }
    const rewrite = (specifier) => {
      if (!/^(\.{1,2}\/|\/)/.test(specifier)) {
        ctx.warnings.push(`Bare module specifier "${specifier}" cannot be resolved in-browser.`);
        return specifier;
      }
      const depPath = resolvePath(specifier.startsWith('/') ? '' : moduleDir, specifier);
      const depEntry = ctx.fs.get(depPath);
      if (!depEntry) throw new DemoError('MISSING_FILE', 'Imported module missing from repository', depPath);
      const depCode = transformModuleSource(depEntry.text, dirname(depPath), ctx, depth + 1);
      return `data:text/javascript;charset=utf-8;base64,${utf8ToBase64(depCode)}`;
    };
    return code
      .replace(/(\b(?:import|export)\b[^;'"]*?\bfrom\s*)(['"])([^'"]+)\2/g,
        (m, pre, q, spec) => pre + q + rewrite(spec) + q)
      .replace(/(\bimport\s*\(\s*)(['"])([^'"]+)\2/g,
        (m, pre, q, spec) => pre + q + rewrite(spec) + q)
      .replace(/^(\s*import\s*)(['"])(\.{1,2}\/[^'"]+)\2/mg,
        (m, pre, q, spec) => pre + q + rewrite(spec) + q);
  }

  // ------------------------------------------
  // Sandboxed-frame bootstrap: storage stubs + error reporting to parent
  // ------------------------------------------
  const SANDBOX_SHIM = `(function(){
  function memoryStore(){var m=new Map();return{getItem:function(k){return m.has(k)?m.get(k):null},setItem:function(k,v){m.set(k,String(v))},removeItem:function(k){m.delete(k)},clear:function(){m.clear()},key:function(i){return Array.from(m.keys())[i]||null},get length(){return m.size}};}
  try{window.localStorage.getItem('__probe');}catch(e){
    try{Object.defineProperty(window,'localStorage',{value:memoryStore(),configurable:true});}catch(e2){}
    try{Object.defineProperty(window,'sessionStorage',{value:memoryStore(),configurable:true});}catch(e3){}
  }
  window.addEventListener('error',function(e){
    try{parent.postMessage({__ghDemoFrame:true,type:'error',message:e.message,source:e.filename,line:e.lineno},'*');}catch(err){}
  });
  window.addEventListener('unhandledrejection',function(e){
    try{parent.postMessage({__ghDemoFrame:true,type:'rejection',message:String(e.reason)},'*');}catch(err){}
  });
})();`;

  const PREVIEW_POLICY = "default-src 'none'; script-src data:; style-src 'unsafe-inline' data:; img-src data:; font-src data:; media-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

  function dependencyRefs(text, filePath) {
    const refs = [];
    const pattern = /\.(?:m?js)$/i.test(filePath)
      ? /(?:\b(?:import|export)\b[^;'"\n]*?\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"]+)\1/g
      : /(?:@import\s+(?:url\(\s*)?|url\(\s*)(['"]?)([^'")\s]+)\1/g;
    for (const match of text.matchAll(pattern)) {
      const target = match[2];
      if (!isExternal(target) && (!/\.(?:m?js)$/i.test(filePath) || /^(\.{1,2}\/|\/)/.test(target))) refs.push(resolvePath(dirname(filePath), target));
    }
    return [...new Set(refs)].filter(Boolean);
  }

  // Collect every local reference from a parsed document.
  function collectLocalRefs(doc, pageDir) {
    const assets = [];
    const pages = [];
    const pushRef = (raw, list) => {
      if (!raw) return;
      const clean = raw.trim().split('#')[0];
      if (!clean || isExternal(clean)) return;
      list.push(resolvePath(pageDir, clean));
    };
    for (const link of Array.from(doc.querySelectorAll('link[href]'))) {
      const rel = (link.getAttribute('rel') || '').toLowerCase();
      if (rel.includes('stylesheet') || rel.includes('icon') || rel.includes('manifest') || rel.includes('apple-touch')) {
        pushRef(link.getAttribute('href'), assets);
      }
    }
    for (const script of Array.from(doc.querySelectorAll('script[src]'))) pushRef(script.getAttribute('src'), assets);
    for (const style of doc.querySelectorAll('style')) assets.push(...dependencyRefs(style.textContent || '', pageDir + 'inline.css'));
    for (const node of doc.querySelectorAll('[style]')) assets.push(...dependencyRefs(node.getAttribute('style') || '', pageDir + 'inline.css'));
    for (const script of doc.querySelectorAll('script:not([src])')) assets.push(...dependencyRefs(script.textContent || '', pageDir + 'inline.js'));
    for (const el of Array.from(doc.querySelectorAll('img[src], source[src], video[src], video[poster], audio[src], track[src], embed[src], object[data], input[type="image"][src]'))) {
      for (const attr of ['src', 'poster', 'data']) pushRef(el.getAttribute(attr), assets);
    }
    for (const el of Array.from(doc.querySelectorAll('[srcset]'))) {
      for (const part of (el.getAttribute('srcset') || '').split(',')) {
        pushRef(part.trim().split(/\s+/)[0], assets);
      }
    }
    for (const anchor of Array.from(doc.querySelectorAll('a[href]'))) {
      const href = anchor.getAttribute('href') || '';
      const clean = href.trim().split('#')[0];
      if (!clean || isExternal(clean) || !/\.html?(?:\?|$)/i.test(clean)) continue;
      pages.push(resolvePath(pageDir, clean));
    }
    return { assets: [...new Set(assets)], pages: [...new Set(pages)] };
  }

  // Rewrite an HTML document: inline CSS/JS, convert assets to data URLs.
  function processHtml(htmlText, entryPath, ctx) {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    doc.querySelectorAll('base, meta[http-equiv]').forEach(node => {
      if (node.tagName === 'BASE' || /^(refresh|content-security-policy)$/i.test(node.getAttribute('http-equiv') || '')) node.remove();
    });
    const pageDir = dirname(entryPath);

    for (const link of Array.from(doc.querySelectorAll('link[href]'))) {
      const rel = (link.getAttribute('rel') || '').toLowerCase();
      const href = link.getAttribute('href') || '';
      if (isExternal(href)) continue;
      const assetPath = resolvePath(pageDir, href);
      const entry = ctx.fs.get(assetPath);
      if (!entry) { ctx.missing.push(assetPath); continue; }
      if (rel.includes('stylesheet')) {
        const style = doc.createElement('style');
        style.setAttribute('data-from', href);
        style.textContent = rewriteCss(entry.text, dirname(assetPath), ctx);
        link.replaceWith(style);
      } else if (rel.includes('icon') || rel.includes('manifest') || rel.includes('apple-touch')) {
        link.setAttribute('href', dataUrlFor(entry, assetPath));
      }
    }

    for (const styleEl of Array.from(doc.querySelectorAll('style:not([data-from])'))) {
      styleEl.textContent = rewriteCss(styleEl.textContent || '', pageDir, ctx);
    }
    for (const node of doc.querySelectorAll('[style]')) node.setAttribute('style', rewriteCss(node.getAttribute('style') || '', pageDir, ctx));

    for (const script of Array.from(doc.querySelectorAll('script'))) {
      const src = script.getAttribute('src') || '';
      const type = (script.getAttribute('type') || '').toLowerCase();
      if (type && !['module', 'text/javascript', 'application/javascript'].includes(type)) continue;
      if (src && isExternal(src)) {
        ctx.warnings.push('External scripts are disabled in the isolated preview.');
        script.remove();
        continue;
      }
      const scriptPath = src ? resolvePath(pageDir, src) : entryPath;
      const entry = src ? ctx.fs.get(scriptPath) : { text: script.textContent || '' };
      if (!entry) { ctx.missing.push(scriptPath); script.remove(); continue; }
      const replacement = doc.createElement('script');
      for (const attr of Array.from(script.attributes)) {
        if (!['src', 'integrity', 'crossorigin'].includes(attr.name)) replacement.setAttribute(attr.name, attr.value);
      }
      const isModule = (replacement.getAttribute('type') || '').toLowerCase() === 'module';
      const code = isModule
        ? transformModuleSource(entry.text, dirname(scriptPath), ctx, 0)
        : entry.text;
      replacement.setAttribute('src', `data:text/javascript;charset=utf-8;base64,${utf8ToBase64(code)}`);
      script.replaceWith(replacement);
    }

    for (const el of Array.from(doc.querySelectorAll('img[src], source[src], video[src], video[poster], audio[src], track[src], embed[src], object[data], input[type="image"][src]'))) {
      for (const attr of ['src', 'poster', 'data']) {
        const value = el.getAttribute(attr);
        if (!value || isExternal(value)) continue;
        const assetPath = resolvePath(pageDir, value.trim());
        const entry = ctx.fs.get(assetPath);
        if (!entry) { ctx.missing.push(assetPath); continue; }
        el.setAttribute(attr, dataUrlFor(entry, assetPath));
      }
    }
    for (const el of Array.from(doc.querySelectorAll('[srcset]'))) {
      const parts = (el.getAttribute('srcset') || '').split(',').map(part => {
        const bits = part.trim().split(/\s+/);
        if (!bits[0] || isExternal(bits[0])) return part.trim();
        const assetPath = resolvePath(pageDir, bits[0]);
        const entry = ctx.fs.get(assetPath);
        if (!entry) { ctx.missing.push(assetPath); return part.trim(); }
        bits[0] = dataUrlFor(entry, assetPath);
        return bits.join(' ');
      }).filter(Boolean);
      el.setAttribute('srcset', parts.join(', '));
    }

    for (const anchor of Array.from(doc.querySelectorAll('a[href]'))) {
      const href = anchor.getAttribute('href') || '';
      const clean = href.trim().split('#')[0];
      if (!clean || isExternal(clean) || !/\.html?(?:\?|$)/i.test(clean)) continue;
      const rendered = ctx.subPagesRendered.get(resolvePath(pageDir, clean));
      if (rendered && rendered.length <= LIMITS.maxAnchorHtmlBytes) {
        anchor.setAttribute('href', `data:text/html;charset=utf-8;base64,${utf8ToBase64(rendered)}`);
      }
    }

    const eventBindings = [];
    let handlerId = 0;
    for (const node of doc.querySelectorAll('*')) {
      for (const attr of Array.from(node.attributes)) {
        if (!/^on[a-z]+$/i.test(attr.name)) continue;
        const id = '__preview_event_' + handlerId++;
        node.setAttribute(id, '');
        node.removeAttribute(attr.name);
        eventBindings.push(`document.querySelector('[${id}]').addEventListener(${JSON.stringify(attr.name.slice(2).toLowerCase())}, function(event){if((function(event){${attr.value}\n}).call(this,event)===false){event.preventDefault();}});`);
      }
    }
    if (eventBindings.length) {
      const handlers = doc.createElement('script');
      handlers.src = `data:text/javascript;charset=utf-8;base64,${utf8ToBase64(eventBindings.join('\n'))}`;
      doc.body.append(handlers);
    }
    const shim = doc.createElement('script');
    shim.id = '__ghDemoSandboxShim';
    shim.src = `data:text/javascript;charset=utf-8;base64,${utf8ToBase64(SANDBOX_SHIM)}`;
    doc.head.prepend(shim);
    const policy = doc.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = PREVIEW_POLICY;
    doc.head.prepend(policy);
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }

  function buildStats(ctx) {
    return {
      filesLoaded: ctx.loadedCount,
      totalBytes: ctx.totalBytes,
      missing: ctx.missing.slice(0, 25),
      warnings: ctx.warnings.slice(0, 25)
    };
  }

  // ------------------------------------------
  // prepareStaticProject: fetch referenced files, then rewrite into runnable HTML
  // ------------------------------------------
  async function prepareStaticProject(config) {
    const { owner, repo, branch, treePaths, force = false } = config;
    const subdirPrefix = normalizeDir(config.subdir);
    const scopedPaths = scopePaths(treePaths, config.subdir);
    const set = new Set(scopedPaths);
    const entryDir = normalizeDir(config.entryDir || '');
    const indexPath = entryDir + 'index.html';

    if (!set.has(indexPath)) {
      throw new DemoError('MISSING_ENTRY', 'No index.html found',
        `No index.html exists${subdirPrefix ? ` under "${subdirPrefix}"` : ' at the repository root'} — there is no page to run.`);
    }

    const remotePath = filePath => subdirPrefix + filePath;
    const ctx = {
      fs: new Map(),
      treeSet: set,
      totalBytes: 0,
      loadedCount: 0,
      missing: [],
      warnings: [],
      subPagesRendered: new Map(),
      linkedPages: []
    };

    async function loadIntoFs(filePath, required) {
      if (ctx.fs.has(filePath)) return ctx.fs.get(filePath);
      if (!ctx.treeSet.has(filePath)) {
        if (required) throw new DemoError('MISSING_FILE', 'Required file missing from repository', filePath);
        if (!ctx.missing.includes(filePath)) ctx.missing.push(filePath);
        return null;
      }
      if (ctx.loadedCount >= LIMITS.maxFiles) {
        throw new DemoError('TOO_MANY_FILES', 'Too many project files loaded',
          `Exceeded the in-browser limit of ${LIMITS.maxFiles} files.`);
      }
      const asBinary = BINARY_EXT.has(extOf(filePath));
      const remainingBytes = LIMITS.maxTotalBytes - ctx.totalBytes;
      if (remainingBytes <= 0) throw new DemoError('TOO_LARGE', 'Project too large to run in-browser', 'The preview has reached its total download limit.');
      const entry = await fetchGithubFile(owner, repo, branch, remotePath(filePath), { binary: asBinary, force, maxBytes: remainingBytes });
      ctx.totalBytes += entry.bytes.length;
      if (ctx.totalBytes > LIMITS.maxTotalBytes) {
        throw new DemoError('TOO_LARGE', 'Project too large to run in-browser',
          `Loaded ${(ctx.totalBytes / 1048576).toFixed(1)} MB which exceeds the ${Math.round(LIMITS.maxTotalBytes / 1048576)} MB safety limit.`);
      }
      ctx.fs.set(filePath, entry);
      ctx.loadedCount += 1;
      return entry;
    }

    // Breadth-first prefetch: index.html, its assets, then linked pages.
    const visitedPages = new Set();
    const pageQueue = [indexPath];

    while (pageQueue.length) {
      const pagePath = pageQueue.shift();
      if (visitedPages.has(pagePath)) continue;
      visitedPages.add(pagePath);
      if (!(extOf(pagePath) === 'html' || extOf(pagePath) === 'htm')) continue;
      if (visitedPages.size > LIMITS.maxSubPages) break;

      const entry = await loadIntoFs(pagePath, true);
      if (!entry) continue;

      const probeDoc = new DOMParser().parseFromString(entry.text, 'text/html');
      const { assets, pages } = collectLocalRefs(probeDoc, dirname(pagePath));

      for (const asset of assets) await loadIntoFs(asset, false);
      for (const page of pages) {
        if (page === indexPath || !set.has(page)) continue;
        if (!ctx.linkedPages.includes(page)) ctx.linkedPages.push(page);
        if (visitedPages.size + pageQueue.length < LIMITS.maxSubPages) pageQueue.push(page);
      }
    }

    // Follow local stylesheet/module imports and CSS asset references. The old
    // loader fetched only direct HTML references, leaving nested assets broken.
    const dependencyQueue = [...ctx.fs.keys()].map(path => ({ path, depth: 0 }));
    const visitedDependencies = new Set();
    while (dependencyQueue.length) {
      const { path, depth } = dependencyQueue.shift();
      if (visitedDependencies.has(path) || !/\.(?:css|m?js)$/i.test(path)) continue;
      visitedDependencies.add(path);
      const entry = ctx.fs.get(path);
      for (const dependency of dependencyRefs(entry.text || '', path)) {
        if (visitedDependencies.has(dependency)) continue;
        if (depth >= LIMITS.maxImportDepth) throw new DemoError('IMPORT_DEPTH', 'Imports nested too deeply', 'The preview limits nested stylesheet and module imports.');
        const loaded = await loadIntoFs(dependency, false);
        if (loaded) dependencyQueue.push({ path: dependency, depth: depth + 1 });
      }
    }

    // Render linked pages first so index anchors can embed them.
    for (const pagePath of ctx.linkedPages.slice(0, LIMITS.maxSubPages)) {
      if (!ctx.fs.has(pagePath)) continue;
      try {
        ctx.subPagesRendered.set(pagePath, processHtml(ctx.fs.get(pagePath).text, pagePath, ctx));
      } catch (err) {
        ctx.warnings.push(`Linked page skipped (${pagePath}): ${err.message}`);
      }
    }
    const html = processHtml(ctx.fs.get(indexPath).text, indexPath, ctx);

    if (ctx.warnings.length) console.warn('[demo-runner] Rewriting warnings:', ctx.warnings.slice(0, 20));
    if (ctx.missing.length) console.info('[demo-runner] Referenced files not found in repository:', ctx.missing.slice(0, 20));

    return { html, stats: buildStats(ctx) };
  }

  // ------------------------------------------
  // Build support hooks
  // ------------------------------------------
  async function buildProject(repoInfo, options = {}) {
    if (global.DEMO_BUILD_SERVICE && typeof global.DEMO_BUILD_SERVICE.build === 'function') {
      return global.DEMO_BUILD_SERVICE.build(repoInfo, options);
    }
    return {
      supported: false,
      reason: 'No build service is connected to this environment. Installing dependencies and compiling requires Node.js/npm on a server; a browser tab cannot run "npm install".'
    };
  }

  async function serveBuild(config) {
    const buildDir = findCommittedBuild(config.scopedPaths);
    if (!buildDir) return null;
    const built = await prepareStaticProject({
      owner: config.owner, repo: config.repo, branch: config.branch,
      treePaths: config.treePaths, subdir: config.subdir,
      entryDir: buildDir, force: config.force
    });
    built.notice = `Running the production build committed to "${buildDir}index.html" — the framework source was not rebuilt locally.`;
    return built;
  }

  // ------------------------------------------
  // Orchestrator
  // ------------------------------------------
  async function runDemo(projectConfig, hooks, options = {}) {
    const safeHooks = Object.assign({
      onStep: () => {},
      completeStep: () => {},
      failStep: () => {},
      onReady: () => {},
      onNotice: () => {},
      onUnavailable: () => {},
      onError: () => {},
      renderStatic: () => {},
      renderDeployed: () => {},
      renderLocalDemo: () => {}
    }, hooks || {});

    const force = !!options.force;
    const github = projectConfig.github || '';
    const demoUrl = safeHttpsUrl(projectConfig.demoUrl || '');

    try {
      // Priority 1: existing live deployment.
      if (demoUrl) {
        safeHooks.onStep(`Loading deployed demo (${new URL(demoUrl).hostname})…`);
        safeHooks.renderDeployed(demoUrl);
        safeHooks.completeStep();
        safeHooks.onReady('Deployed application loaded.');
        return { status: 'deployed', url: demoUrl };
      }

      const repoInfo = parseGithubUrl(github);

      // Bundled examples run immediately, including offline. Source links stay available.
      // Do not wait for optional GitHub verification before showing a local example.
      if (['calculator', 'iris'].includes(projectConfig.localDemo)) {
        safeHooks.onStep('Preparing browser example…');
        await safeHooks.renderLocalDemo({ kind: projectConfig.localDemo, sourceInfo: null });
        safeHooks.completeStep();
        safeHooks.onReady('Browser example ready — all computation runs locally.');
        return { status: 'local-demo', sourceInfo: null };
      }

      // No repository configured at all.
      if (!repoInfo) {
        safeHooks.failStep();
        safeHooks.onUnavailable({
          title: 'Demo unavailable',
          detail: 'No public GitHub repository is linked for this project yet, so there is no source code to inspect or run.\n\nAdd the real repository URL to this project’s configuration ("github" field) to enable live inspection.',
          actions: [{ label: 'Open GitHub profile ↗', href: 'https://github.com/CodeWithYazzy' }]
        });
        return { status: 'unavailable', reason: 'no-repository' };
      }

      // Inspect the real repository.
      safeHooks.onStep('Loading repository…');
      const { owner, repo, subdir } = repoInfo;
      const branch = repoInfo.branch || await getDefaultBranch(owner, repo, { force });

      safeHooks.completeStep();
      safeHooks.onStep('Inspecting project…');
      const treePaths = await getRepoTree(owner, repo, branch, { force });

      let packageJsonText = null;
      const scopedPaths = scopePaths(treePaths, subdir);
      if (subdir && scopedPaths.length === 0) {
        safeHooks.failStep();
        safeHooks.onUnavailable({
          title: 'Project code not yet pushed',
          detail: `This project folder is a placeholder — no files have been pushed to GitHub yet.\n\nExpected location:\nhttps://github.com/${owner}/${repo}/tree/${branch}/${subdir}\n\nPush your code to that folder and the demo will be inspected automatically. Until then, View Source opens the (empty) folder.`,
          actions: [{ label: 'Open Folder on GitHub ↗', href: `https://github.com/${owner}/${repo}/tree/${branch}/${subdir}` }]
        });
        return { status: 'unavailable', reason: 'placeholder-empty' };
      }
      if (scopedPaths.includes('package.json')) {
        try {
          packageJsonText = (await fetchGithubFile(owner, repo, branch, normalizeDir(subdir) + 'package.json', { force })).text;
        } catch (err) {
          console.warn('[demo-runner] package.json could not be read:', err.message);
        }
      }
      const detection = detectProjectType(scopedPaths, packageJsonText);
      safeHooks.completeStep();
      safeHooks.onStep(`Detected: ${detection.label}`);

      const runContext = { owner, repo, branch, subdir, treePaths, scopedPaths, force };

      // A. Static HTML/CSS/JS -> run the actual repository code.
      if (detection.type === 'A') {
        safeHooks.onStep('Preparing demo…');
        const prepared = await prepareStaticProject({ ...runContext, entryDir: detection.entryDir || '' });
        safeHooks.renderStatic(prepared.html, detection.label, prepared.stats);
        safeHooks.completeStep();
        safeHooks.onReady(`Demo Ready — actual repository code running (${prepared.stats.filesLoaded} files, ${(prepared.stats.totalBytes / 1024).toFixed(0)} KB fetched).`);
        return { status: 'static', stats: prepared.stats };
      }

      // B/C. Framework frontends -> committed build, else live-build explanation.
      if (detection.type === 'B' || detection.type === 'C') {
        const committed = await serveBuild(runContext);
        if (committed) {
          safeHooks.onStep('Preparing demo…');
          safeHooks.renderStatic(committed.html, detection.label, committed.stats);
          safeHooks.completeStep();
          safeHooks.onNotice(committed.notice);
          safeHooks.onReady('Demo Ready — prebuilt output from the repository.');
          return { status: 'prebuilt', stats: committed.stats };
        }
        const buildPlan = await buildProject({ owner, repo, branch });
        safeHooks.failStep();
        if (buildPlan.supported && safeHttpsUrl(buildPlan.url)) {
          safeHooks.onNotice('Build service connected — serving generated output.');
          safeHooks.renderDeployed(buildPlan.url);
          safeHooks.onReady('Demo Ready — freshly built from source.');
          return { status: 'built', url: buildPlan.url };
        }
        safeHooks.onUnavailable({
          title: 'Source available on GitHub — live build required',
          detail: `This repository uses ${detection.label}. Framework source needs an install + compile step ("npm install" plus Vite/Next/webpack) before any browser can execute it — a plain web page cannot build it on the fly.${buildPlan.reason ? `\n\n${buildPlan.reason}` : ''}\n\nNo dist/build folder is committed here and no deployment URL ("demoUrl") is configured. Add either one and the demo will run instantly.`,
          actions: [{
            label: 'View Source on GitHub ↗',
            href: `https://github.com/${owner}/${repo}${subdir ? `/tree/${branch}/${subdir}` : ''}`
          }]
        });
        return { status: 'unavailable', reason: 'build-required' };
      }

      // D. Node backend (a committed browser build can still be served).
      if (detection.type === 'D') {
        const committedNodeBuild = await serveBuild(runContext);
        if (committedNodeBuild) {
          safeHooks.onStep('Preparing demo…');
          safeHooks.renderStatic(committedNodeBuild.html, detection.label, committedNodeBuild.stats);
          safeHooks.completeStep();
          safeHooks.onNotice(committedNodeBuild.notice);
          safeHooks.onReady('Demo Ready — prebuilt output from the repository.');
          return { status: 'prebuilt', stats: committedNodeBuild.stats };
        }
        safeHooks.failStep();
        safeHooks.onUnavailable({
          title: 'Cannot run in-browser — server required',
          detail: `Detected: ${detection.label}. This project needs a Node.js process listening on a port, which a static web page cannot start. Deploy it (Render, Fly.io, a VPS…) and configure the project's "demoUrl" to showcase it live.`,
          actions: [{ label: 'View Source on GitHub ↗', href: `https://github.com/${owner}/${repo}` }]
        });
        return { status: 'unavailable', reason: 'server-required' };
      }

      // E. Python backend.
      if (detection.type === 'E') {
        safeHooks.failStep();
        safeHooks.onUnavailable({
          title: 'Cannot run in-browser — Python required',
          detail: `Detected: ${detection.label}. Python programs must be executed by a Python interpreter, not a web browser.`,
          actions: [{ label: 'View Source on GitHub ↗', href: `https://github.com/${owner}/${repo}` }]
        });
        return { status: 'unavailable', reason: 'python-required' };
      }

      // F. Unsupported.
      safeHooks.failStep();
      const listing = scopedPaths.slice(0, 10).join('\n');
      safeHooks.onUnavailable({
        title: 'Unable to run repository directly',
        detail: `Detected: ${detection.label}. No executable entry point supported by the browser runner was found (no index.html, no recognized framework).\n\nTop-level contents:\n${listing}${scopedPaths.length > 10 ? `\n…and ${scopedPaths.length - 10} more files` : ''}`,
        actions: [{ label: 'Open Repository ↗', href: `https://github.com/${owner}/${repo}` }]
      });
      return { status: 'unavailable', reason: 'unsupported' };

    } catch (err) {
      console.error('[demo-runner]', err);
      safeHooks.failStep();
      safeHooks.onError(friendlyError(err));
      return { status: 'error', error: friendlyError(err) };
    }
  }

  // ------------------------------------------
  // Public API
  // ------------------------------------------
  const GithubDemoRunner = {
    DemoError,
    friendlyError,
    clearCache,
    parseGithubUrl,
    safeHttpsUrl,
    fetchGithubRepo,
    getDefaultBranch,
    getRepoTree,
    fetchGithubFile,
    detectProjectType,
    findCommittedBuild,
    scopePaths,
    resolvePath,
    prepareStaticProject,
    buildProject,
    serveBuild,
    runDemo,
    LIMITS
  };

  global.GithubDemoRunner = GithubDemoRunner;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GithubDemoRunner;
  }
})(typeof window !== 'undefined' ? window : globalThis);

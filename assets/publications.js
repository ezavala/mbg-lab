(() => {
  const target = document.querySelector("#publication-list");
  if (!target) return;

  const latexMap = [
    [/\\'\\?\\{?a\\}?/gi,"á"], [/\\'\\?\\{?e\\}?/gi,"é"], [/\\'\\?\\{?i\\}?/gi,"í"],
    [/\\'\\?\\{?o\\}?/gi,"ó"], [/\\'\\?\\{?u\\}?/gi,"ú"], [/\\'\\?\\{?n\\}?/gi,"ń"],
    [/\\"\{?a\}?/gi,"ä"], [/\\"\{?e\}?/gi,"ë"], [/\\"\{?i\}?/gi,"ï"], [/\\"\{?o\}?/gi,"ö"], [/\\"\{?u\}?/gi,"ü"],
    [/\\~\{?n\}?/gi,"ñ"], [/\\~\{?a\}?/gi,"ã"], [/\\~\{?o\}?/gi,"õ"],
    [/\\c\{?c\}?/gi,"ç"], [/\\ss\b/g,"ß"],
    [/\\`\\?\\{?a\\}?/gi,"à"], [/\\`\\?\\{?e\\}?/gi,"è"], [/\\`\\?\\{?i\\}?/gi,"ì"], [/\\`\\?\\{?o\\}?/gi,"ò"], [/\\`\\?\\{?u\\}?/gi,"ù"]
  ];

  function cleanLatex(value="") {
    let s = value;
    latexMap.forEach(([pattern, replacement]) => { s = s.replace(pattern, replacement); });
    return s
      .replace(/\\&/g, "&")
      .replace(/\\%/g, "%")
      .replace(/\\_/g, "_")
      .replace(/\\textit\{([^{}]*)\}/g, "$1")
      .replace(/\\emph\{([^{}]*)\}/g, "$1")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitEntries(text) {
    const entries = [];
    let i = 0;
    while (i < text.length) {
      const at = text.indexOf("@", i);
      if (at === -1) break;
      const typeMatch = text.slice(at).match(/^@([A-Za-z]+)\s*([\{\(])/);
      if (!typeMatch) { i = at + 1; continue; }
      const type = typeMatch[1].toLowerCase();
      const opener = typeMatch[2];
      const closer = opener === "{" ? "}" : ")";
      let pos = at + typeMatch[0].length;
      let depth = 1, quote = false, escaped = false;
      while (pos < text.length && depth > 0) {
        const ch = text[pos];
        if (escaped) { escaped = false; pos++; continue; }
        if (ch === "\\") { escaped = true; pos++; continue; }
        if (ch === '"') quote = !quote;
        if (!quote) {
          if (ch === opener) depth++;
          else if (ch === closer) depth--;
        }
        pos++;
      }
      if (depth === 0) entries.push({type, raw:text.slice(at + typeMatch[0].length, pos - 1)});
      i = pos;
    }
    return entries;
  }

  function parseFields(raw) {
    const firstComma = raw.indexOf(",");
    if (firstComma === -1) return {};
    let s = raw.slice(firstComma + 1), fields = {}, i = 0;

    while (i < s.length) {
      while (i < s.length && /[\s,]/.test(s[i])) i++;
      const keyStart = i;
      while (i < s.length && /[A-Za-z0-9_:-]/.test(s[i])) i++;
      const key = s.slice(keyStart, i).trim().toLowerCase();
      while (i < s.length && /\s/.test(s[i])) i++;
      if (!key || s[i] !== "=") { i++; continue; }
      i++;
      while (i < s.length && /\s/.test(s[i])) i++;

      let value = "";
      if (s[i] === "{") {
        i++;
        let depth = 1, escaped = false;
        const start = i;
        while (i < s.length && depth > 0) {
          const ch = s[i];
          if (escaped) { escaped = false; i++; continue; }
          if (ch === "\\") { escaped = true; i++; continue; }
          if (ch === "{") depth++;
          else if (ch === "}") depth--;
          i++;
        }
        value = s.slice(start, i - 1);
      } else if (s[i] === '"') {
        i++;
        let escaped = false, out = "";
        while (i < s.length) {
          const ch = s[i++];
          if (escaped) { out += ch; escaped = false; continue; }
          if (ch === "\\") { out += ch; escaped = true; continue; }
          if (ch === '"') break;
          out += ch;
        }
        value = out;
      } else {
        const start = i;
        while (i < s.length && s[i] !== ",") i++;
        value = s.slice(start, i).trim();
      }
      fields[key] = cleanLatex(value);
    }
    return fields;
  }

  function formatAuthors(authorField="") {
    const names = authorField.split(/\s+and\s+/i).map(x => x.trim()).filter(Boolean);
    return names.map(name => {
      if (name.includes(",")) {
        const [last, ...rest] = name.split(",");
        const given = rest.join(",").trim();
        return `${cleanLatex(given)} ${cleanLatex(last)}`.trim();
      }
      return cleanLatex(name);
    }).join(", ");
  }

  function publicationVenue(fields, type) {
    const venue = fields.journal || fields.booktitle || fields.publisher || fields.school || fields.institution || "";
    const bits = [];
    if (venue) bits.push(`<em>${escapeHtml(venue)}</em>`);
    if (fields.volume) bits.push(`vol. ${escapeHtml(fields.volume)}`);
    if (fields.number) bits.push(`no. ${escapeHtml(fields.number)}`);
    if (fields.pages) bits.push(`pp. ${escapeHtml(fields.pages.replace(/--/g,"–"))}`);
    return bits.join(" · ");
  }

  function escapeHtml(s="") {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function render(entries) {
    if (!entries.length) {
      target.innerHTML = '<p class="publication-error">No publications were found in <code>publications.bib</code>.</p>';
      return;
    }

    const grouped = new Map();
    entries.forEach(entry => {
      const year = entry.fields.year || "Other";
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year).push(entry);
    });

    const years = [...grouped.keys()].sort((a,b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return Number(b) - Number(a);
    });

    target.innerHTML = years.map(year => {
      const pubs = grouped.get(year)
        .sort((a,b) => (a.fields.title || "").localeCompare(b.fields.title || ""))
        .map(entry => {
          const f = entry.fields;
          const title = escapeHtml(f.title || "Untitled publication");
          const authors = escapeHtml(formatAuthors(f.author || ""));
          const venue = publicationVenue(f, entry.type);
          const rawDoi = (f.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
          const doiUrl = rawDoi ? `https://doi.org/${encodeURI(rawDoi)}` : "";
          const lookupKey = `${f.title || ""}||${year}`;
          const action = doiUrl
            ? `<a class="publication-link doi-link" href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener" aria-label="Open DOI for ${title}">DOI ↗</a>`
            : `<a class="publication-link doi-link doi-pending" href="#" target="_blank" rel="noopener" data-doi-title="${escapeHtml(f.title || "")}" data-doi-year="${escapeHtml(year)}" data-doi-key="${escapeHtml(lookupKey)}" aria-label="DOI link for ${title}" hidden>DOI ↗</a>`;
          return `<article class="pub publication-entry">
            <div class="publication-year-mobile">${escapeHtml(year)}</div>
            <div class="publication-body">
              <h4>${title}</h4>
              ${authors ? `<p class="publication-authors">${authors}</p>` : ""}
              ${venue ? `<p class="publication-venue">${venue}</p>` : ""}
            </div>
            ${action}
          </article>`;
        }).join("");

    setupPublicationCollapse();

      return `<section class="publication-year-group">
        <div class="publication-year-label">${escapeHtml(year)}</div>
        <div class="publication-year-items">${pubs}</div>
      </section>`;
    }).join("");

    resolveMissingDois();
  }

  const DOI_CACHE_KEY = "mbm-publication-dois-v1";

  function normaliseTitle(value="") {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function titleSimilarity(a, b) {
    const aa = new Set(normaliseTitle(a).split(/\s+/).filter(Boolean));
    const bb = new Set(normaliseTitle(b).split(/\s+/).filter(Boolean));
    if (!aa.size || !bb.size) return 0;
    let intersection = 0;
    aa.forEach(word => { if (bb.has(word)) intersection++; });
    const union = new Set([...aa, ...bb]).size;
    return union ? intersection / union : 0;
  }

  function crossrefYear(item) {
    const fields = ["published-print", "published-online", "published", "issued", "created"];
    for (const field of fields) {
      const dateParts = item?.[field]?.["date-parts"];
      const year = dateParts?.[0]?.[0];
      if (year) return Number(year);
    }
    return null;
  }

  function loadDoiCache() {
    try {
      return JSON.parse(localStorage.getItem(DOI_CACHE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveDoiCache(cache) {
    try {
      localStorage.setItem(DOI_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // The publication list still works if storage is unavailable.
    }
  }

  async function lookupDoi(title, year) {
    const endpoint = new URL("https://api.crossref.org/works");
    endpoint.searchParams.set("query.title", title);
    endpoint.searchParams.set("rows", "5");
    endpoint.searchParams.set("select", "DOI,title,published,published-print,published-online,issued,created");

    const response = await fetch(endpoint.toString(), {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Crossref HTTP ${response.status}`);

    const items = (await response.json())?.message?.items || [];
    const requestedYear = /^\d{4}$/.test(String(year)) ? Number(year) : null;

    let best = null;
    for (const item of items) {
      const candidateTitle = Array.isArray(item.title) ? item.title[0] : item.title;
      const similarity = titleSimilarity(title, candidateTitle || "");
      const candidateYear = crossrefYear(item);
      const yearCompatible = !requestedYear || !candidateYear || Math.abs(candidateYear - requestedYear) <= 1;

      if (yearCompatible && similarity >= 0.72 && (!best || similarity > best.similarity)) {
        best = { doi: item.DOI, similarity };
      }
    }
    return best?.doi || "";
  }

  async function resolveMissingDois() {
    const links = [...document.querySelectorAll(".doi-pending")];
    if (!links.length) return;

    const cache = loadDoiCache();
    const queue = [];

    links.forEach(link => {
      const key = link.dataset.doiKey || "";
      if (Object.prototype.hasOwnProperty.call(cache, key)) {
        if (cache[key]) {
          link.href = `https://doi.org/${encodeURI(cache[key])}`;
          link.hidden = false;
          link.classList.remove("doi-pending");
        }
      } else {
        queue.push(link);
      }
    });

    // Resolve a few publications concurrently to avoid overwhelming Crossref.
    const workers = Math.min(4, queue.length);
    let cursor = 0;

    async function worker() {
      while (cursor < queue.length) {
        const link = queue[cursor++];
        const title = link.dataset.doiTitle || "";
        const year = link.dataset.doiYear || "";
        const key = link.dataset.doiKey || "";

        try {
          const doi = await lookupDoi(title, year);
          cache[key] = doi || null;
          saveDoiCache(cache);

          if (doi) {
            link.href = `https://doi.org/${encodeURI(doi)}`;
            link.hidden = false;
            link.classList.remove("doi-pending");
          }
        } catch (error) {
          console.warn("DOI lookup failed for:", title, error);
          // Do not cache transient network errors.
        }

        await new Promise(resolve => setTimeout(resolve, 120));
      }
    }

    await Promise.all(Array.from({length: workers}, worker));
  }

  fetch("publications.bib", {cache:"no-store"})
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(text => {
      const parsed = splitEntries(text)
        .filter(entry => !["comment","preamble","string"].includes(entry.type))
        .map(entry => ({...entry, fields:parseFields(entry.raw)}))
        .filter(entry => entry.fields.title);
      render(parsed);
      setupPublicationCollapse();
    })
    .catch(error => {
      console.error("Could not load publications.bib", error);
      target.innerHTML = `<div class="publication-error">
        <strong>Publications could not be loaded in this preview.</strong>
        <span>If you opened <code>index.html</code> directly from your computer, browsers block local file requests. The list will load normally on GitHub Pages. For local testing, run a small web server in this folder (for example <code>python3 -m http.server</code>).</span>
      </div>`;
    });


  const PUBLICATIONS_INITIAL_COUNT = 10;

  function setupPublicationCollapse() {
    const list = document.querySelector("#publication-list");
    const section = document.querySelector("#publications");
    if (!list || !section) return;

    // Remove any old toggle so repeated renders cannot create duplicates.
    section.querySelector(".publications-toggle-wrap")?.remove();

    const entries = [...list.querySelectorAll(".publication-entry")];
    const yearGroups = [...list.querySelectorAll(".publication-year-group")];

    if (entries.length <= PUBLICATIONS_INITIAL_COUNT) return;

    const wrap = document.createElement("div");
    wrap.className = "publications-toggle-wrap";

    const toggle = document.createElement("button");
    toggle.id = "publications-toggle";
    toggle.className = "publications-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");

    wrap.appendChild(toggle);
    list.insertAdjacentElement("afterend", wrap);

    let expanded = false;

    function applyState() {
      entries.forEach((entry, index) => {
        const hide = !expanded && index >= PUBLICATIONS_INITIAL_COUNT;
        entry.hidden = hide;
        // Explicit inline display makes the behaviour independent of any
        // existing .publication-entry { display:grid } rule.
        entry.style.display = hide ? "none" : "";
      });

      yearGroups.forEach(group => {
        const groupEntries = [...group.querySelectorAll(".publication-entry")];
        const hasVisibleEntry = groupEntries.some(entry => entry.style.display !== "none");
        group.hidden = !hasVisibleEntry;
        group.style.display = hasVisibleEntry ? "" : "none";
      });

      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.innerHTML = expanded
        ? 'Show fewer <span aria-hidden="true">↑</span>'
        : 'View all publications <span aria-hidden="true">↓</span>';
    }

    toggle.addEventListener("click", () => {
      expanded = !expanded;
      applyState();

      if (!expanded) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    applyState();
  }
})();

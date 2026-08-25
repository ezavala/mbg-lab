(() => {
  const target = document.querySelector("#data-list");
  if (!target) return;

  const latexMap = [
    [/\\'\\?\\{?a\\}?/gi,"á"], [/\\'\\?\\{?e\\}?/gi,"é"], [/\\'\\?\\{?i\\}?/gi,"í"],
    [/\\'\\?\\{?o\\}?/gi,"ó"], [/\\'\\?\\{?u\\}?/gi,"ú"], [/\\'\\?\\{?n\\}?/gi,"ń"],
    [/\\"\{?a\}?/gi,"ä"], [/\\"\{?e\}?/gi,"ë"], [/\\"\{?i\}?/gi,"ï"], [/\\"\{?o\}?/gi,"ö"], [/\\"\{?u\}?/gi,"ü"],
    [/\\~\{?n\}?/gi,"ñ"], [/\\~\{?a\}?/gi,"ã"], [/\\~\{?o\}?/gi,"õ"],
    [/\\c\{?c\}?/gi,"ç"], [/\\ss\b/g,"ß"]
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
    return authorField.split(/\s+and\s+/i).map(x => x.trim()).filter(Boolean).map(name => {
      if (name.includes(",")) {
        const [last, ...rest] = name.split(",");
        return `${cleanLatex(rest.join(",").trim())} ${cleanLatex(last)}`.trim();
      }
      return cleanLatex(name);
    }).join(", ");
  }

  function escapeHtml(s="") {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  function render(entries) {
    if (!entries.length) {
      target.innerHTML = '<p class="publication-error">No data outputs were found in <code>data.bib</code>.</p>';
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
      const items = grouped.get(year)
        .sort((a,b) => (a.fields.title || "").localeCompare(b.fields.title || ""))
        .map(entry => {
          const f = entry.fields;
          const title = escapeHtml(f.title || "Untitled dataset");
          const authors = escapeHtml(formatAuthors(f.author || ""));
          const repository = f.repository || f.publisher || f.institution || f.howpublished || "";
          const rawDoi = (f.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
          const doiUrl = rawDoi ? `https://doi.org/${encodeURI(rawDoi)}` : "";
          const url = f.url || doiUrl;
          const action = url
            ? `<a class="publication-link data-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">${doiUrl ? "DOI" : "View data"} ↗</a>`
            : "";

          return `<article class="pub publication-entry data-entry">
            <div class="publication-body">
              <h4>${title}</h4>
              ${authors ? `<p class="publication-authors">${authors}</p>` : ""}
              ${repository ? `<p class="publication-venue">${escapeHtml(repository)}</p>` : ""}
            </div>
            ${action}
          </article>`;
        }).join("");

      return `<section class="publication-year-group data-year-group">
        <div class="publication-year-label">${escapeHtml(year)}</div>
        <div class="publication-year-items">${items}</div>
      </section>`;
    }).join("");
  }

  fetch("data.bib", {cache:"no-store"})
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
    })
    .catch(error => {
      console.error("Could not load data.bib", error);
      target.innerHTML = `<div class="publication-error">
        <strong>Data outputs could not be loaded in this preview.</strong>
        <span>If you opened <code>index.html</code> directly, browsers may block local file requests. The list will load normally when the site is hosted.</span>
      </div>`;
    });
})();

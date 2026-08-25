# Mathematical Biomedicine Group website

Starter static website for the Mathematical Biomedicine Group, University of Manchester.

## Deploy with GitHub Pages

1. Create a GitHub repository, e.g. `mbg-lab`.
2. Upload `index.html` and the `assets/` folder.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/root`.
5. GitHub will publish the site.

## Custom domain

Use `mbg-lab.org` once registered. In GitHub Pages, add the custom domain and configure the domain's DNS records as instructed by GitHub.

## Updating the site

For the first version, content is intentionally contained in `index.html` so it is easy to understand and maintain. A later iteration can migrate publications, people and projects to Markdown/Hugo once the content architecture is settled.

## Publication note

Google Scholar blocks automated retrieval. The current starter therefore includes a curated set of publications verified against the University of Manchester Research Explorer. Replace/expand these records with a BibTeX export from Google Scholar or an ORCID/BibTeX workflow before launch.

## Publication DOI links

The site uses a `doi = {...}` field from `publications.bib` whenever one is present. For entries without a DOI field, `assets/publications.js` attempts to match the publication title and year against Crossref and displays a DOI link when a high-confidence match is found. Resolved DOI values are cached in the visitor's browser.

For maximum reliability, add DOI fields directly to `publications.bib` when you know them, for example:

```bibtex
doi = {10.1016/j.tem.2019.01.008},
```

## Data outputs

Dataset records are maintained separately in `data.bib`. Add or edit BibTeX entries there and the Data section of the website will update automatically.

Useful optional fields are:

```bibtex
doi = {10.xxxx/xxxxx},
url = {https://...},
repository = {Zenodo},
```

The replication-data entry for *High resolution daily profiles of tissue adrenal steroids by portable automated collection* has been moved from `publications.bib` to `data.bib`.

## Code & Models

Code and model outputs are maintained separately in `models.bib`. Add or edit BibTeX entries there and the Code & Models section will update automatically.

The initial entry points to:

`https://hpaaxis.streamlit.app/`

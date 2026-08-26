# Mathematical Biomedicine Group website

Static website for the Mathematical Biomedicine Group, University of Manchester.

## Custom domain

Use `mbg-lab.org` once registered. In GitHub Pages, add the custom domain and configure the domain's DNS records as instructed by GitHub.

## Updating the site

For the first version, content is intentionally contained in `index.html` so it is easy to understand and maintain. A later iteration can migrate publications, people and projects to Markdown/Hugo once the content architecture is settled.

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

## Code & Models

Code and model outputs are maintained separately in `models.bib`. Add or edit BibTeX entries there and the Code & Models section will update automatically.

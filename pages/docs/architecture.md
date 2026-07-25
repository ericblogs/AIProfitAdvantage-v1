# Architecture Overview

## Runtime

The website is a dependency-free static HTML, CSS and ECMAScript module application. GitHub Pages can host it without a build step.

## Active structure

- `index.html` contains semantic page content, public metadata and local production assets.
- `style.css` owns design tokens, layout and responsive rules.
- `script.js` starts the application.
- `config/app-config.js` contains non-secret, public runtime metadata.
- `js/components.js` contains presentational interactions; `js/utils.js` contains small DOM utilities.

## Boundary

Configuration must never contain credentials. Payment, authentication, analytics, CRM, LMS, marketplace and community implementation are outside the approved RC-1.2.0 scope.

## Change control

No change outside the approved release scope may be introduced without formal approval. Capture future work in the roadmap rather than adding inactive code.

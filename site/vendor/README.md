# vendor — third-party libs for the offline build (verified, committed)

**English** | [中文](README.zh-CN.md)

Dependencies of `build-offline.js`. **Committed** (rather than fetched over the network at build time) to keep this repo's "build is fully offline, deterministically reproducible" property; versions are pinned and the files are immutable.

| File | Version | Use | sha384 |
|---|---|---|---|
| `react.production.min.js` | react 18.3.1 | **Ships with the product** (UMD, MIT, license header kept) | `DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z` |
| `react-dom.production.min.js` | react-dom 18.3.1 | Same | `gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1` |
| `babel.min.js` | @babel/standalone 7.29.0 | **Build-time only** (precompiles JSX in Node, never ships) | `m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y` (same SRI as `../public/index.html`) |

Chain of trust and re-fetch commands:

```bash
# React: verify the whole npm package (dist.integrity, sha512), then extract the UMD from the tarball
curl -sfLO https://registry.npmjs.org/react/-/react-18.3.1.tgz        # sha512-wS+hAgJShR0K…
curl -sfLO https://registry.npmjs.org/react-dom/-/react-dom-18.3.1.tgz # sha512-5m4nQKp+rZRb…
tar -xzf react-18.3.1.tgz package/umd/react.production.min.js
tar -xzf react-dom-18.3.1.tgz package/umd/react-dom.production.min.js

# Babel: same SRI as the one pinned in the live index.html
curl -sfL -o babel.min.js https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
```

On every build, `build-offline.js` re-verifies the three files against the sha384 above and refuses to build on a mismatch. These files have two consumers: `build-offline.js` (the offline single file, which reads this dir) and the **live site** — `public/index.html` now uses copies under `public/vendor/` (production min, zero CDN). When bumping a version: re-fetch the files → update both copies (this dir and `public/vendor/`) → update the SRI in `index.html` and the sha384 in the table above (React/Babel are now the same production build with the same hash in all three places).

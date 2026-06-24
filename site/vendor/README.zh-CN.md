# vendor — 离线构建所需的第三方库（已校验，入库）

[English](README.md) | **中文**

`build-offline.js` 的依赖。**提交入库**（而非构建时联网拉取）以保持本仓库"构建全离线、可确定性复现"的性质；版本钉死，文件不可变。

| 文件 | 版本 | 用途 | sha384 |
|---|---|---|---|
| `react.production.min.js` | react 18.3.1 | **随产物分发**（UMD，MIT，license 头保留） | `DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z` |
| `react-dom.production.min.js` | react-dom 18.3.1 | 同上 | `gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1` |
| `babel.min.js` | @babel/standalone 7.29.0 | **仅构建期使用**（Node 内预编译 JSX，不进产物） | `m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y`（与 `../public/index.html` 的 SRI 同源） |

信任链与重取命令：

```bash
# React:npm registry 整包完整性校验(dist.integrity, sha512)后从 tarball 解出 UMD
curl -sfLO https://registry.npmjs.org/react/-/react-18.3.1.tgz        # sha512-wS+hAgJShR0K…
curl -sfLO https://registry.npmjs.org/react-dom/-/react-dom-18.3.1.tgz # sha512-5m4nQKp+rZRb…
tar -xzf react-18.3.1.tgz package/umd/react.production.min.js
tar -xzf react-dom-18.3.1.tgz package/umd/react-dom.production.min.js

# Babel:与线上 index.html 钉的同一 SRI
curl -sfL -o babel.min.js https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
```

`build-offline.js` 每次构建都会按上表 sha384 重新校验三个文件，不匹配即拒绝构建。本目录的文件有两个消费方：`build-offline.js`（离线单文件，读本目录）与**线上站点**——`public/index.html` 现改用 `public/vendor/` 的副本（production min，零 CDN）。升级版本号时：重新取文件 → 同步更新本目录与 `public/vendor/` 两处副本 → 改 `index.html` 的 SRI 与本表 sha384（React/Babel 三处现在都是同一 production 构建、同一哈希）。

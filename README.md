[![npm](https://img.shields.io/npm/v/browser-ava.svg)](https://www.npmjs.com/package/browser-ava)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![bundlejs](https://deno.bundlejs.com/?q=browser-ava\&badge=detailed)](https://bundlejs.com/?q=browser-ava)
[![downloads](http://img.shields.io/npm/dm/browser-ava.svg?style=flat-square)](https://npmjs.org/package/browser-ava)
[![GitHub Issues](https://img.shields.io/github/issues/arlac77/browser-ava.svg?style=flat-square)](https://github.com/arlac77/browser-ava/issues)
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Farlac77%2Fbrowser-ava%2Fbadge\&style=flat)](https://actions-badge.atrox.dev/arlac77/browser-ava/goto)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/arlac77/browser-ava/badge.svg)](https://snyk.io/test/github/arlac77/browser-ava)
[![Coverage Status](https://coveralls.io/repos/arlac77/browser-ava/badge.svg)](https://coveralls.io/github/arlac77/browser-ava)
# browser-ava
Run ava tests in the browser


## What it does

If your code does not depend on any node api (process, fs, ...) then this runner allows to run your ava test inside the browser.

### Running your tests

```console
browser-ava --webkit --chromium --firefox tests/*.mjs
```

![Scrrenshot](docs/screenshot.png)

## limitations

- only supports ESM


## install

```console
npm -g install browser-ava
```
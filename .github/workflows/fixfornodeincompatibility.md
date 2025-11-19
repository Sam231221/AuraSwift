In compile-and-test.yml

```
build-and-test:
  runs-on: windows-latest
  env:
    PYTHON: python
    MSVS-VERSION: 2022
    GYP-MSVS-VERSION: 2022
  steps:
    - uses: actions/checkout@v5

    - name: Setup Node.js 18 for native module compatibility
      uses: actions/setup-node@v4
      with:
        node-version: "18"
        cache: "npm"
```

Q.i have set node 18 but even though it fails??

Short answer: your runner is still using Node 22 because either the setup-node step didn’t run early enough (some earlier step ran npm/node) or the node_modules cache/previous install (or a later step) is reintroducing artifacts built with Node 22. The logs show Node.js v22.21.1 and node-gyp errors (spawn EINVAL, EBUSY rmdir), which are symptomatic of a Node-version mismatch + locked native modules on Windows.

What to do (concrete, prioritized):

1. Ensure setup-node runs before anything that touches npm/node (cache restore, install, build).

- Move your actions/setup-node step to be the very first step after checkout.
- Use an explicit semver: node-version: "18.x".

2. Add quick diagnostic prints (temporary) to verify Node/npm are what you expect:

- Add right after setup-node:
  - run: node -v && npm -v
  - run: where node && echo %PATH% (Windows runner; or PowerShell: Get-Command node; $env:Path)

3. Avoid restoring incompatible node_modules cache and clean before install

- The logs show cache/restore issues and EBUSY while removing node_modules. Disable or reconfigure cache while you diagnose.
- Add a clean step before install to remove node_modules and lockfiles and clear npm cache.

4. Use a clean install command and build only after node is verified

- Use npm ci (recommended in CI) inside each workspace package, not npm install, so you get a reproducible, clean install.
- If you have workspace packages, run npm ci from repo root or run per-package.

5. If native modules still fail on Windows:

- Try Node 18.x (LTS) explicitly — you already intended that; ensure it actually runs.
- Add --build-from-source for problematic packages when necessary or add optional flags to skip optional native modules (if acceptable).
- If EBUSY persists, it can be caused by AV/scanning or a locked process; retry after clean or use a fresh runner.

Example updated job (replace your job steps) — put setup-node immediately after checkout, print version, clean, then install:

- name: build-and-test (snippet)
  runs-on: windows-latest
  env:
  PYTHON: python
  MSVS-VERSION: 2022
  GYP-MSVS-VERSION: 2022
  steps:

  - uses: actions/checkout@v5

  # Setup Node as the first thing that affects node

  - name: Setup Node 18 (must run before cache/install)
    uses: actions/setup-node@v4
    with:
    node-version: '18.x'

    # temporarily disable setup-node caching to avoid stale node_modules:

    cache: ''

  - name: Verify node and npm
    run: |
    node -v
    npm -v
    if ($env:OS -eq 'Windows_NT') { where node } else { which node }
    shell: pwsh

  - name: Clean workspace (remove node_modules & lockfiles)
    run: |
    npm cache clean --force
    Remove-Item -LiteralPath .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath .\packages\main\node_modules -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath package-lock.json -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath packages\main\package-lock.json -Force -ErrorAction SilentlyContinue
    shell: pwsh

  - name: Install dependencies (clean)
    run: npm ci
    shell: pwsh

  - name: Build / test
    run: npm run build --if-present && npm test
    shell: pwsh

Notes / rationale for these changes

- actions/setup-node must be executed before cache restore or any step that runs node/npm. If you have an actions/cache step earlier, move setup-node before it. If cache restores node_modules built with Node 22, you will see mismatches and node-gyp failures.
- Use '18.x' for explicit LTS; "18" sometimes works but using the semver wildcard or exact LTS is clearer.
- The logs you provided show EBUSY while removing better-sqlite3/usb and spawn EINVAL in node-gyp-build — both often happen when binary modules were built with a different Node ABI, or when files are locked. A clean install with correct Node version resolves most cases.
- If you must use caching later, configure it to include node-version and package-lock hash, e.g. a manual cache key like: ${{ runner.os }}-node-18-${{ hashFiles('**/package-lock.json') }} so it won’t restore artifacts built under Node 22. Or use setup-node cache properly with cache-dependency-path.

Reference: your workflow file at the commit used by the run:
https://github.com/Sam231221/AuraSwift/blob/f219b47a8c7d7e403c968b2d67a9bade165ffbc1/.github/workflows/ci.yml

If you want I can:

- Inspect your full workflow and suggest exact edits (I can fetch the file and propose a PR).
- Produce a minimal patched workflow with the changes above. Which would you prefer?

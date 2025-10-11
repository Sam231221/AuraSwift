For the "Configure environment for Windows native modules" step in your workflow, here’s a targeted check and solution:

**Problems found:**

- The step uses `shell: powershell` but mixes PowerShell and bash syntax, which can cause failures.
- The environment variables (`PYTHON`, `MSVS-VERSION`, `GYP-MSVS-VERSION`) are set only for this step, potentially causing issues for subsequent steps that require them.

**How to fix:**

1. **Consistent Shell Usage:** Use either bash or PowerShell syntax exclusively within the step, matching the `shell:` you specify.
2. **Environment Variables:** Set required environment variables globally for the job if other steps also depend on them.
3. **Error Handling:** Add explicit error handling to surface any issues.

**Corrected step for PowerShell:**

```yaml
- name: Configure environment for Windows native modules
  run: |
    Write-Host "Setting up modern Windows build environment..."
    Write-Host "Node.js version: $(node --version)"
    Write-Host "Python version: $(python --version)"
    $msbuild = Get-Command msbuild -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    Write-Host "MSBuild available: $msbuild"
    Write-Host "Environment configured - using proper environment variables for node-gyp"
    Write-Host "Modern Windows build environment ready (Node.js 18+ with MSBuild 2022)"

    # Verify node-gyp can find build tools (using environment variables)
    npx node-gyp configure
    if ($LASTEXITCODE -ne 0) {
      Write-Host "❌ node-gyp configuration failed"
      exit 1
    } else {
      Write-Host "✅ node-gyp configuration successful"
    }
  shell: pwsh
  env:
    PYTHON: python
    MSVS_VERSION: 2022
    GYP_MSVS_VERSION: 2022
```

**Key changes:**

- Uses `Write-Host` for PowerShell output.
- Uses `$LASTEXITCODE` to check for errors.
- Sets environment variables with underscores (`MSVS_VERSION`, `GYP_MSVS_VERSION`)—be consistent with usage in your scripts and node-gyp requirements.

**If you want to use bash throughout, change `shell: powershell` to `shell: bash` and update the commands and environment variable access accordingly.**

Reference: [Job step in compile-and-test.yml (ref: 0100a4098da47d22d2a448eaf672fd0a48275b91)](https://github.com/Sam231221/AuraSwift/blob/0100a4098da47d22d2a448eaf672fd0a48275b91/.github/workflows/compile-and-test.yml)

Let me know if you need this fixed in the file or want help with a different shell!

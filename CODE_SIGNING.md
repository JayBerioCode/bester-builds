# Code Signing Guide — Bester.Builds Desktop App

This document explains how to obtain a Windows Authenticode code-signing certificate, configure it in the GitHub Actions release pipeline, and verify that the installer and app binary are correctly signed. Once signed, users will no longer see the Windows SmartScreen "unrecognised app" warning during installation.

---

## Why Code Signing Matters

Windows SmartScreen evaluates every downloaded executable against a reputation database maintained by Microsoft. Unsigned binaries — regardless of their actual content — are blocked by default and require the user to click **More info → Run anyway**. This friction increases user drop-off during installation and erodes trust in the product.

A valid Authenticode signature tells Windows that the binary was produced by a known, verified publisher and has not been tampered with since it was signed. An **Extended Validation (EV)** certificate goes further: it carries an immediate reputation boost with SmartScreen, meaning the warning disappears from the very first download rather than only after the binary accumulates enough download history.

| Certificate Type | SmartScreen Warning | Cost (approx.) | Validation Time |
|---|---|---|---|
| **No certificate** | Always shown | Free | — |
| **OV (Organisation Validation)** | Shown until reputation builds (~weeks) | USD 200–400 / yr | 1–3 business days |
| **EV (Extended Validation)** | Removed immediately | USD 400–700 / yr | 3–7 business days |

For a production desktop app, an EV certificate is strongly recommended.

---

## Step 1 — Obtain a Certificate

### Recommended Certificate Authorities

The following CAs are trusted by Windows and commonly used for Electron apps:

| CA | EV Available | Notes |
|---|---|---|
| [DigiCert](https://www.digicert.com/signing/code-signing-certificates) | Yes | Industry standard; hardware token required for EV |
| [Sectigo (Comodo)](https://sectigo.com/ssl-certificates-tls/code-signing) | Yes | Competitive pricing |
| [GlobalSign](https://www.globalsign.com/en/code-signing-certificate) | Yes | Good for teams |
| [SSL.com](https://www.ssl.com/certificates/ev-code-signing/) | Yes | Lower cost EV option |
| [SignPath Foundation](https://signpath.org) | No (OV only) | Free for open-source projects |

### What You Will Receive

After purchasing and completing identity verification, the CA will issue a `.pfx` (PKCS#12) file containing both the certificate and its private key, protected by a password you set during generation. **Keep this file and password secure — anyone with access can sign binaries in your name.**

> **EV certificates only:** EV certificates are bound to a hardware security token (USB dongle) by the CA. You cannot export the private key. For CI signing with an EV certificate, you must use a cloud HSM service such as [DigiCert KeyLocker](https://www.digicert.com/signing/keylocker), [SSL.com eSigner](https://www.ssl.com/esigner/), or [Azure Trusted Signing](https://azure.microsoft.com/en-us/products/trusted-signing) — see the **Cloud HSM Signing** section below.

---

## Step 2 — Prepare the Certificate for CI

The GitHub Actions workflow expects the certificate as a base64-encoded string stored in a repository secret. This avoids committing the binary file to version control.

### Encode the Certificate

Run the following command on your local machine (Linux/macOS) or in Git Bash / WSL on Windows:

```bash
base64 -w 0 your-certificate.pfx > cert_b64.txt
```

The output file `cert_b64.txt` contains the single-line base64 string you will paste into GitHub.

On macOS, use:

```bash
base64 -i your-certificate.pfx -o cert_b64.txt
```

### Add Repository Secrets

Navigate to your repository on GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

Add the following two secrets:

| Secret Name | Value |
|---|---|
| `WIN_CERTIFICATE_BASE64` | The full contents of `cert_b64.txt` |
| `WIN_CERTIFICATE_PASSWORD` | The password you set when exporting the `.pfx` |

> **Security note:** Repository secrets are encrypted at rest and are never exposed in workflow logs. They are only injected into the runner environment during the job that references them.

---

## Step 3 — How the Workflow Uses the Certificate

The `release.yml` workflow handles signing automatically when the secrets are present. The relevant steps are:

**Step 8 — Decode signing certificate:** If `WIN_CERTIFICATE_BASE64` is set, the base64 string is decoded back to a `.pfx` file at `/tmp/certificate.pfx` inside the runner. The file path is passed to subsequent steps via `${{ steps.cert.outputs.path }}`.

**Step 9 — Package, sign, and publish:** `electron-builder` is invoked with the following environment variables:

```
CSC_LINK=file:///tmp/certificate.pfx
CSC_KEY_PASSWORD=<WIN_CERTIFICATE_PASSWORD>
WIN_CSC_LINK=file:///tmp/certificate.pfx
WIN_CSC_KEY_PASSWORD=<WIN_CERTIFICATE_PASSWORD>
```

`electron-builder` uses these to call `signtool.exe` (via Wine on Linux runners) and signs both the main `Bester.Builds.exe` binary and the NSIS installer wrapper. The `rfc3161TimeStampServer` configured in `electron-builder.yml` ensures the signature includes a trusted timestamp, so the signature remains valid after the certificate expires.

**Step 10 — Report signing status:** A summary step prints whether the build was signed or unsigned, and links to this guide if the secret is missing.

---

## Step 4 — Trigger a Signed Release

Once the secrets are configured, push a version tag to trigger the workflow:

```bash
# Ensure package.json version matches (the workflow syncs it automatically)
git tag v1.1.0
git push origin v1.1.0
```

The workflow will build, sign, and publish the installer to GitHub Releases. The release notes will include a ✅ badge confirming the build is signed.

---

## Cloud HSM Signing (EV Certificates)

EV certificates cannot be exported to a `.pfx` file. Instead, the private key lives on a hardware token or cloud HSM. The following services provide a CI-compatible workflow:

### Option A — DigiCert KeyLocker

DigiCert KeyLocker is a cloud-based HSM that stores your EV private key and exposes a `signtool`-compatible API. Replace the certificate decode step with the following:

```yaml
- name: Sign with DigiCert KeyLocker
  uses: digicert/ssm-code-signing@v1
  with:
    sm-api-key: ${{ secrets.SM_API_KEY }}
    sm-client-cert-file-b64: ${{ secrets.SM_CLIENT_CERT_FILE_B64 }}
    sm-client-cert-password: ${{ secrets.SM_CLIENT_CERT_PASSWORD }}
    sm-host: https://clientauth.one.digicert.com
```

Then pass `SM_CODE_SIGNING_CERT_SHA1_HASH` to `electron-builder` via `WIN_CSC_LINK` using the `certthumbprint:` URI scheme.

### Option B — SSL.com eSigner

SSL.com eSigner provides a similar cloud signing API. Use the [ssl-com/esigner-codesign](https://github.com/SSLcom/esigner-codesign) GitHub Action to sign the built `.exe` after `electron-builder` produces it (without signing), then re-package.

### Option C — Azure Trusted Signing

Microsoft's own cloud signing service, available from the Azure portal. Use the [azure/trusted-signing-action](https://github.com/Azure/trusted-signing-action) GitHub Action. This is the lowest-friction option if your organisation already uses Azure.

---

## Local Signing (Development / Testing)

To test signing locally before setting up CI, install [osslsigncode](https://github.com/mtrojnar/osslsigncode) on Linux/macOS or use `signtool.exe` on Windows.

```bash
# Linux — sign an existing .exe with osslsigncode
osslsigncode sign \
  -pkcs12 your-certificate.pfx \
  -pass "your-password" \
  -n "Bester.Builds" \
  -i "https://besterbuilds.cfd" \
  -t http://timestamp.digicert.com \
  -h sha256 \
  -in "release/Bester.Builds Setup 1.0.0.exe" \
  -out "release/Bester.Builds Setup 1.0.0 Signed.exe"
```

To verify the signature:

```bash
osslsigncode verify -in "release/Bester.Builds Setup 1.0.0 Signed.exe"
```

On Windows, right-click the `.exe` → **Properties → Digital Signatures** to view the certificate details.

---

## Self-Signed Certificates (Not Recommended for Distribution)

A self-signed certificate can be used for internal testing but **will not remove SmartScreen warnings** for external users. Windows will still block the installer unless the certificate is manually imported into the user's Trusted Root store — which is impractical for end-user distribution.

To generate a self-signed certificate for local testing only:

```powershell
# PowerShell (Windows)
New-SelfSignedCertificate `
  -Subject "CN=Bester.Builds Test" `
  -Type CodeSigningCert `
  -CertStoreLocation Cert:\CurrentUser\My `
  -NotAfter (Get-Date).AddYears(1)

# Export to .pfx
$cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Subject -like "*Bester.Builds*" }
Export-PfxCertificate -Cert $cert -FilePath test-cert.pfx -Password (ConvertTo-SecureString "test123" -AsPlainText -Force)
```

---

## Troubleshooting

**The workflow skips signing even though I added the secrets.**
Verify the secret name is exactly `WIN_CERTIFICATE_BASE64` (case-sensitive). Check the Actions run log for the "Decode signing certificate" step — it will print the decoded file size. If the step is skipped, the `if:` condition evaluated to false, meaning the secret resolved to an empty string.

**`signtool` reports "The specified PFX file do not exist".**
The `file://` URI in `CSC_LINK` must use three slashes on Linux (`file:///tmp/certificate.pfx`). The workflow constructs this correctly via the `format()` expression.

**The installer is signed but SmartScreen still appears.**
OV certificates require accumulated download reputation before SmartScreen removes the warning. This typically takes several weeks and hundreds of downloads. Switch to an EV certificate for immediate trust.

**`osslsigncode` fails with "No certificate found".**
Ensure the `.pfx` was exported with the full certificate chain. In Windows Certificate Manager, check "Include all certificates in the certification path" when exporting.

---

## References

The following resources provide additional context on Windows code signing and the tools used in this pipeline.

- [Microsoft — Authenticode Code Signing](https://learn.microsoft.com/en-us/windows-hardware/drivers/install/authenticode)
- [electron-builder — Code Signing](https://www.electron.build/code-signing)
- [DigiCert — Code Signing Certificates](https://www.digicert.com/signing/code-signing-certificates)
- [SSL.com — EV Code Signing](https://www.ssl.com/certificates/ev-code-signing/)
- [GitHub Actions — Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [osslsigncode](https://github.com/mtrojnar/osslsigncode)
- [Azure Trusted Signing](https://azure.microsoft.com/en-us/products/trusted-signing)

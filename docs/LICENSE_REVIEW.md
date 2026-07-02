# License Review

**Reviewed:** July 2, 2026
**Status:** Owner/legal confirmation required; no license grant changed by this audit

## Current repository statements

- `LICENSE.md` applies the MIT License to the software and names “Joe Rossi Hall of Fame” as the 2025 copyright holder.
- `LICENSE.content.md` applies CC BY-NC 4.0 broadly to all non-code content, including text, images, media, event information, biographies, and historical documentation.

This is a recognizable dual-license structure for a website repository, but the repository alone cannot prove that “Joe Rossi Hall of Fame” is the correct legal rights holder or that JR and Associates, Inc. has authority to license every historical photograph, biography, logo, flyer, and third-party contribution.

## Recommended strategy

1. An authorized JR and Associates, Inc. representative should confirm the legal copyright name and whether the code is intentionally open source under MIT. Keep MIT for code if that is the approved intent.
2. Do not apply a blanket Creative Commons license to material unless the organization owns the relevant rights or has authority to sublicense it. Creative Commons grants only rights the licensor has authority to grant and warns that other rights may still limit reuse: <https://creativecommons.org/licenses/by-nc/4.0/legalcode>.
3. Prefer an explicit content schedule:
   - organization-owned text and specifically approved media may use CC BY-NC 4.0 if open noncommercial reuse is intended;
   - third-party photographs, logos, programs, flyers, and contributed biographies should carry their own notice or remain all rights reserved unless a release/license is documented;
   - public-domain material should be identified as such rather than relicensed.
4. Record photographer/creator, source, permission, allowed uses, attribution, and approval for new media in the controlled originals archive and the public derivative manifest.
5. After approval, update the copyright holder/year and content exceptions in one legal-review pull request. Do not silently rewrite the existing license files during routine maintenance.

## Maintainer rule

Until the owner decision is recorded, preserve `LICENSE.md` and `LICENSE.content.md`, describe them as the repository's current stated terms, and avoid promising that every historical asset is reusable under CC BY-NC 4.0.

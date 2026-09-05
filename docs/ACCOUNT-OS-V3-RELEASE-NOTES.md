# Account OS V3 Release Candidate Notes

Account OS V3 is a local-first desktop identity vault: encrypted account records, service identities, account relationships, a dependency Map, appearance themes, and encrypted backup/recovery. Optional connected functionality is a ciphertext-only sync foundation; the master password remains local.

The RC verification used only synthetic data. It includes a 10-account, 6-relationship persistence exercise, encrypted backup export, correct-password restore, wrong-password rejection, corrupt-backup rejection, and non-mutating failed restore checks.

V3 does not yet include Windows Hello, OS-secure key storage, an automatic updater, or an independent professional security audit. Native screenshot automation is environment-blocked by Windows virtual-desktop capture routing, so final visual approval is a direct human review of the isolated synthetic profile.

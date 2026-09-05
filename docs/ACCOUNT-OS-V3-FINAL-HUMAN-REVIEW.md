# Account OS V3 Final Human Review

Use only the isolated synthetic review profile. Do not enter real credentials. Mark each item GREEN (ship), YELLOW (minor polish), or RED (release blocker). Target: 10-15 minutes.

## A. Native visual review

1. Create/Unlock screen: password purpose and primary action are clear.
2. Vault Hybrid: populated list is readable.
3. Select Google Personal: identity and account view are clear.
4. Select Unknown Custom Service: fallback identity is clear.
5. Compare View and Edit: they are visibly distinct.
6. Open Add Account: fields and Save action are understandable.
7. Check relationship summary in an account view.
8. Open Map: nodes and edges are readable.
9. Select a Map node: inspector and relationship state are clear.
10. Check Appearance, Security, Data & Recovery, and Connected settings.
11. Switch Dark and Light themes: text, buttons, and selection states remain readable.
12. Lock and unlock the disposable vault.
13. Check restore green-success and red-error validation boxes if available in the review build.

## B. Disposable installer smoke

1. Use a disposable installation location and profile.
2. Launch the reviewed NSIS or MSI artifact and complete installation.
3. Launch Account OS and verify the fresh Create encrypted vault screen renders without a crash.
4. Create a disposable vault, lock it, unlock it, then close and reopen the app.
5. Uninstall if appropriate for the disposable context.

Do not install over an important Account OS installation and do not use a real vault for this smoke test.

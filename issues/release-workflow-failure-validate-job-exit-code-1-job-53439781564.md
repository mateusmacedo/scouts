## Release workflow failure: validate job exit code 1 (job 53439781564)

**Job run:** [https://github.com/mateusmacedo/scouts/actions/runs/18735000363/job/53439781564](https://github.com/mateusmacedo/scouts/actions/runs/18735000363/job/53439781564)  
**Commit ref:** 33fd5fe03a63d778617d1f920c831d36cc10c516  
**Workflow file (at failing ref):** .github/workflows/release.yml (ref: 33fd5fe03a63d778617d1f920c831d36cc10c516)

### Description:
The Release workflow's validate job failed with exit code 1 during the "Validação de Consistência de Release" step. Logs show multiple cache-restore errors and a warning about not finding a successful workflow run on 'origin/main', causing the action to default to HEAD~1. Key log excerpts:

- Restore cache failed for pnpm, Nx, Go modules, and build artifacts (paths not resolved)
- Warning: "Unable to find a successful workflow run on 'origin/main'... defaulting to use HEAD~1"
- go version: go1.23.12
- Final message: "🔍 Validação de Consistência de Release" followed by exit code 1

### Impact:
- Releases are blocked until validation passes. Cache restore failures may lead to missing dependencies or inconsistent validation results.

### Suggested next steps / debug checklist:
1. Inspect the reusable workflow file .github/workflows/_reusable-release-steps.yml for the validation logic that exits with code 1 and add more logging.
2. Verify cache paths in release.yml (pnpm store, .nx/cache, ~/.cache/go-build, ~/go/pkg/mod, dist/) and ensure those paths exist or adjust them to runner layout.
3. Confirm secrets and tokens (GH_TOKEN, NPM_TOKEN) are configured for the repo or environment the workflow runs in.
4. Investigate why there's no successful workflow run on origin/main (rebased main, force-push?), or set "error-on-no-successful-workflow" to true in the action that checks previous runs to make this fail loudly.
5. Re-run the workflow after fixing logging/cache path issues to capture the specific failing command in validation.

Please investigate and triage. Attach any additional logs from the reusable validation workflow and consider adding verbose logging to help pinpoint the exact failing command.
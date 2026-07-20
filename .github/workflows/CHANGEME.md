# Change Log

All notable changes to hof-rds-api chart and deployment workflows are documented in this file.

The format follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

### Added

- Added GitHub Actions workflow to validate ArgoCD-style Helm rendering against hof-deploy values:
	- .github/workflows/argocd-values-render-validate.yml
- Added Helm chart unit tests for ExternalSecret behavior:
	- charts/hof-rds-api/tests/externalsecret_test.yaml

### Changed

- Hardened ExternalSecret template rendering to safely default target creation policy when target values are omitted:
	- charts/hof-rds-api/templates/externalsecret.yaml
- Hardened runtime secret name helper to safely resolve externalSecret target name when optional blocks are missing:
	- charts/hof-rds-api/templates/_helpers.tpl

### Fixed

- Fixed a chart rendering risk that could fail ArgoCD sync when externalSecret.enabled is true and externalSecret.target is not explicitly set in environment values.

### Validation

- Successfully rendered Helm templates using hof-deploy overlays for all services in prod and uat:
	- acq
	- asc
	- csl
	- ima
	- nrm
	- paf
- Successfully rendered Helm templates with notprod ephemeral values.
- Successfully rendered ExternalSecret with target fields omitted, confirming fallback behavior.

### Follow-up

- Keep the cross-repo render-validation workflow enabled for chart changes to catch deployment-value integration issues before merge.
- If ephemeral ApplicationSet template logic changes in hof-deploy, re-run chart render checks using the same overlay set.

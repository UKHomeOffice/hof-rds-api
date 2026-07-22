# Change Log

All notable changes to hof-rds-api chart and deployment workflows are documented in this file.

The format follows Keep a Changelog and Semantic Versioning.


## [1.0.1] - 2026-07-20

### Added

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

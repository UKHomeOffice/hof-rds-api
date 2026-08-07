# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning.

## [Unreleased]

### Added
- ArgoCD test pod annotation support in chart templates.
- Release and deployment guidance updates in project documentation.

### Changed
- CI Node.js version alignment with the repository engine requirement.
- PR image build trigger behavior for current head updates.

### Fixed
- Chart default `SERVICE_NAME` to improve startup behavior.
- Writable Yarn cache defaults for containerized/chart-based runtime paths.
- Dockerfile vulnerability patch set and related local setup adjustments.

## [2026-08-07]

### Changed
- Consolidated recent chart and CI pipeline improvements from the `CCL-10201` branch into current documentation state.

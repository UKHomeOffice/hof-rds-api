# HOF RDS API Service
Provides a service layer to read, create and delete reports from a SQL table.

**Reading:**  The main application will make a request to this api.  This service will then connect to the database, get the data back and send it to the main application if it is successful

**Saving:** The main application will send the data to this service as an end point.  This service will connect to a database and store that data and respond back to the main application if successful

## Database connection
This repo uses knex which, if NODE_ENV is not set, will try to connect to a localhost instance of postgres. If it is set, it will try to use the below environmental variables `DB_HOST` etc... to connect to a formal DB using the proper credentials.

## Env Vars
You can set the following to specific how you want your results to look:
- `MAX_PAYLOAD_SIZE` - Max payload size for request bodies. Increase this is request body sizes contain base64 strings for storing thumbnail images into the save & return 'session' data
- `PORT` - Custom port you can run this service on
- `MAX_DATA_AGE` - Max age in days of data before it is cleaned from the RDS instance
- `SERVICE_NAME` - This specifies which HOF service to use migrations, seeds and db config from in the './services' folder
- `LATEST_MIGRATION` - This is the latest migration you wanted automated migrations to run up to based on the migration names in the relevant service folder under './services'
- `CLIENT` - This is the database client type. This defaults to postgresql.
- `DB_HOST`,`DB_USER`,`DB_PASS`,`DB_NAME` - These are production credentials for accessing the relevant database.
- `DELETE_EXPIRED_SCHEDULE` - A cron expression to enable a custom schedule to run expired record removal on per service. Defaults to `'0 0 * * *'`
- `UPDATE_BANK_HOLIDAYS_SCHEDULE` - A cron expression to enable a custom schedule to update the bank holiday JSON values. Defaults to `'0 0 1 * *'`

## Local Setup
The migrations and seeds folders are used by knex to setup a local DB with dummy information for testing the service. These are not used in production where it is assumed a separate DB is setup for knex to connect to that is already setup.

Run the following commands to setup a test DB:
```
brew install postgres
brew services start postgresql
psql postgres
CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres';
ALTER ROLE postgres WITH SUPERUSER;
CREATE ROLE knex WITH LOGIN PASSWORD 'knex';
ALTER ROLE knex WITH SUPERUSER;
CREATE DATABASE <DB_NAME>;
\q
```
If you download Postico for Mac (https://eggerapps.at/postico/), you can then inspect your postgres DB for example and look at the test entries inserted into the test table 'Reports'.

You then need to use a knexfile with migrations and seeds folders to populate your database.
The ms-schema repo which is used for migrations in the Modern Slavery service (https://github.com/UKHomeOffice/ms-schema) can be used as a test example and is included in this project. You can run
```
yarn run db:local:setup
```
from that repo to setup your database.

Setup a '.env' file for the service you want to test this against. For example:
```
SERVICE_NAME=asc
NODE_ENV=local
LATEST_MIGRATION=20230428215725_saved_applications (optional - otherwise runs all migrations)
```
Then run `yarn run db:local:migrate` to update your local database with the relevant migrations for local testing.

## Install & Run <a name="install-and-run"></a>
The application can be run on your local machine

## Creating a migration
To create a new migration, go into the relevant service folder, i.e. `cd ./services/<service_name>`, ensure you have `npm i knex -g` and run:
```
SERVICE_NAME=<service_name>
knex migrate:make <migration_name>
```
This will then create the new migration in the migrations folder of the service
Then run
```
NODE_ENV=local
yarn db:local:migrate
```

### Dependencies <a name="dependencies"></a>
You will need to have the following installed:

[Node JS](https://nodejs.org/en/download/releases/) ( LTS Hydrogen v18.x or greater )

[NPM](https://www.npmjs.com/get-npm) ( v8.x )

[Yarn](https://yarnpkg.com) (v1.x)

[PostgreSQL](https://www.postgresql.org/download/) ( v12.x )

## Running the application

Ensure your database service is available and running.

Then to run the service use:

 ```npm start``` to run the server.

With the server running you can run the main app with save and return lookup UI functionality.
See details of how to do this in [modern slavery](https://github.com/UKHomeOffice/modern-slavery) application

## Scheduled jobs

hof-rds-api has funtionality to remove expired records from database tables based on configuration set per service in its `db_tables_config.json`.

Values can be set per table to configure deletion jobs. A single job can be added per table in its configuring object, and if required, additional jobs can be added as an array `customCronJobs`.

The cron schedule for deletion and bank holidaye update jobs can be set as environment variables as outlined above in [Env vars](#env-vars) or left as defaults in `config.js`.

### Deletion job configuration

Required values must be configured per job. Optional values can be set or left to default.

- `tableName`: The name of the table to run the job for. If using `customCronJobs` set this individually for each custom job. Required value.
- `dataRetentionPeriodType`: Calculate which records to retain based period type - optionally "calendar" or "business". Defaults to "calendar".
- `dataRetentionInDays`: The number of days of the chosen period type for which data should be retained, calculated backwards from the current date and time. Required value.
- `dataRetentionDateType`: The timestamp database column used to determine if a record is in the retention period. Defaults to `created_at`.
- `dataRetentionFilter`: Defines the subset of records to process based on their submission status. Remove only records where the status of the record is "submitted" or "unsubmmited". Defaults to "all" (both submitted and unsubmitted will be removed).

Example:

```json
[
  {
    "tableName": "applicants",
    "modelName": "postgres-model",
    "additionalGetResources": ["username"],
    "selectableProps": ["*"]
  },
  {
    "tableName": "applications",
    "modelName": "postgres-model",
    "additionalGetResources": ["applicant_id"],
    "selectableProps": ["*"],
    "dataRetentionPeriodType": "calendar",
    "dataRetentionInDays": "180",
    "customCronJobs": [
      {
        "tableName": "applications",
        "dataRetentionPeriodType": "business",
        "dataRetentionInDays": "5",
        "dataRetentionDateType": "updated_at",
        "dataRetentionFilter": "unsubmitted"
      }
    ]
  }
]
```

> N.B. if a database table does not have a `submitted_at` column setting the `dataRetentionFilter` for that table's config will cause a SQL query error.


## Git Tags and Release Workflow

This repository uses Git tags to trigger the release pipeline, build container images, and push them to the Quay.io container registry.

#### Workflow Overview

Developers push a Git tag following Semantic Versioning (e.g., 1.0.0).

The Drone CI pipeline is automatically triggered only when the tag is pushed from the master branch.

A Docker image is built and pushed to Quay.io.

The image is tagged with:

the semantic version (e.g., 1.0.0)

a content-addressable digest (@sha256:...)

The complete image reference can be used in the format:
**quay.io/yourorg/your-image:1.0.0@sha256:<digest>**

**Tagging for Releases**

To release a new version, follow these steps on the master branch only:

**Make sure you're on the master branch**

git checkout master

**Create and push a semantic version tag**

git tag 1.2.3
git push origin 1.2.3

**Alternatively,** We can create Tags from Git Hosting UI instead of CLI commands

We can also create tags directly from Git hosting provider’s web interface e.g., GitHub

Go to the Releases or Tags section of the repository

Click "Create a new release" or "Add tag"

Use the proper version format (e.g., 1.2.3) and make sure it points to the master branch

This is a convenient way for team members to trigger a release without using the command line.


###  Release Tagging Guidelines for Contributors

When creating a new Git tag (either via CLI or Git UI), please follow these practices to ensure clear, traceable, and production-ready releases:

Attach release notes or changelogs to a tag

Link to issues, PRs, and milestones

Create pre-releases for testing before full deployment

This turns a simple tag into a full-fledged release artifact.


**Important:**

Use valid Semantic Versioning format: v<MAJOR>.<MINOR>.<PATCH> (e.g., 1.0.0, 2.3.1)

The Drone CI pipeline is configured to only trigger on tags created from the master branch.

#### Reason for Usage of image:tag@digest

The format image:tag@digest combines:

Tag (human-readable version, like 1.2.3)

Digest (immutable SHA-256 content identifier)

The digest SHA (sha256:<digest>) is a cryptographic hash that uniquely identifies the image content. You can retrieve it from Quay.io after the image is pushed:

**This guarantees:**

'Consistency' – The image always resolves to the same content.

'Traceability' – You can trace exactly which build and source it came from.

'Security' – Prevents tampering or tag overwriting in registries.

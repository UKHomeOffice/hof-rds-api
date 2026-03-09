'use strict';

const DataRetentionWindowCalculator = require('./lib/data_retention_window_calculator');
const { clearExpired } = require('./db');

/**
 * Compute and attach an `expires_at` value to each record based on retention rules.
 *
 * Why this exists (and why it changed):
 * - Previously, expiry was a single window anchored at `created_at` for all records:
 *   setExpiryToRecords(records, days, type) → expiry = created_at + window.
 * - ASC now requires dual retention windows that depend on submission status and anchor date:
 *   - Unsubmitted → 5 business days from `created_at`.
 *   - Submitted → 30 business days from `submitted_at`.
 * - Those windows are driven by per-table `customCronJobs` and must mirror the scheduler's deletion logic.
 * - This helper therefore selects the appropriate window per record and anchors to created_at/submitted_at accordingly.
 *
 * Parameters:
 * - records: Array of DB rows to enrich with `expires_at`.
 * - defaultDays/defaultType: Optional root table defaults when no matching custom job exists.
 * - customCronJobs: Optional array of job configs (e.g., for ASC submitted/unsubmitted windows).
 *
 * Behaviour:
 * - If record has `submitted_at` and a matching "submitted" job exists, use that job and anchor at `submitted_at`.
 * - Else if record is unsubmitted and an "unsubmitted" job exists, use that job and anchor at `created_at`.
 * - Else, fall back to defaults and anchor to `submitted_at` when present, otherwise `created_at`.
 * - If days/type/anchor cannot be resolved, the record is returned unchanged.
 */
const setExpiryToRecords = (
  records,
  defaultDays,
  defaultType,
  customCronJobs
) => {
  const calc = new DataRetentionWindowCalculator();

  const findJob = filter => {
    if (!Array.isArray(customCronJobs)) {
      return null;
    }
    return customCronJobs.find(job => job.dataRetentionFilter === filter);
  };

  const submittedJob = findJob('submitted');
  const unsubmittedJob = findJob('unsubmitted');

  return records.map(record => {
    const isSubmitted = Boolean(record.submitted_at);

    let days = defaultDays;
    let type = defaultType;
    const anchorDate = isSubmitted ? record.submitted_at : record.created_at;

    if (isSubmitted && submittedJob) {
      days = parseInt(submittedJob.dataRetentionInDays, 10) || days;
      type = submittedJob.dataRetentionPeriodType || type;
    } else if (!isSubmitted && unsubmittedJob) {
      days = parseInt(unsubmittedJob.dataRetentionInDays, 10) || days;
      type = unsubmittedJob.dataRetentionPeriodType || type;
    }

    if (!days || !type || !anchorDate) {
      return record;
    }

    const expiry = calc.getRetentionEndDate(days, type, anchorDate);
    record.expires_at = expiry;
    return record;
  });
};

const applyExpiryFromRetentionRules = (
  records,
  dataRetentionInDays,
  dataRetentionPeriodType,
  customCronJobs
) => {
  if (dataRetentionInDays || customCronJobs) {
    return setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType, customCronJobs);
  }
  return records;
};

const decodeParam = (type, param) => {
  if (type === 'email') {
    return param.includes('@') ? param : Buffer.from(param, 'hex').toString();
  }
  return param;
};

module.exports = (app, props) => {
  const {
    modelName,
    tableName,
    additionalGetResources,
    selectableProps,
    dataRetentionInDays,
    dataRetentionPeriodType,
    customCronJobs
  } = props;

  const Model = require(`./models/${modelName}`);
  const model = new Model(tableName, selectableProps);

  app.get(`/${tableName}/history`, (req, res, next) => {
    if (!req.query.timestamp || !req.query.from) {
      return res.send({
        status: 400,
        message: "Please add a 'timestamp' (column name) and 'from' query to your request"
      });
    }
    return model.getInTimeRange(req.query)
      .then(result =>
        res.json(applyExpiryFromRetentionRules(
          result,
          dataRetentionInDays,
          dataRetentionPeriodType,
          customCronJobs
        ))).catch(next);
  });

  app.get(`/${tableName}/metrics`, (req, res, next) => {
    return model.getMetrics(req.query)
      .then(result => {
        return res.json(result);
      })
      .catch(next);
  });

  app.get(`/${tableName}/:id`, (req, res, next) => {
    return model.get({ id: req.params.id })
      .then(result =>
        res.json(applyExpiryFromRetentionRules(
          result,
          dataRetentionInDays,
          dataRetentionPeriodType,
          customCronJobs
        ))).catch(next);
  });

  if (additionalGetResources) {
    additionalGetResources.forEach(resource => {
      app.get(`/${tableName}/${resource}/:${resource}`, (req, res, next) => {
        return model.get({ [resource]: decodeParam(resource, req.params[resource]) })
          .then(result =>
            res.json(applyExpiryFromRetentionRules(
              result,
              dataRetentionInDays,
              dataRetentionPeriodType,
              customCronJobs
            ))).catch(next);
      });
    });
  }

  app.post(`/${tableName}`, (req, res, next) => {
    return model.create(req.body)
      .then(result =>
        res.json(applyExpiryFromRetentionRules(
          result,
          dataRetentionInDays,
          dataRetentionPeriodType,
          customCronJobs
        ))).catch(next);
  });

  app.patch(`/${tableName}/:id`, (req, res, next) => {
    return model.patch(req.params.id, req.body)
      .then(result =>
        res.json(applyExpiryFromRetentionRules(
          result,
          dataRetentionInDays,
          dataRetentionPeriodType,
          customCronJobs
        ))).catch(next);
  });

  app.delete(`/${tableName}/:id`, (req, res, next) => {
    return model.delete(req.params.id)
      .then(() => {
        return res.sendStatus(200);
      })
      .catch(next);
  });

  app.delete(`/${tableName}/clear/:status/:dateType/older/:days/:periodType`, (req, res, next) => {
    const { status, dateType, days, periodType } = req.params;
    return clearExpired(tableName, days, periodType, status, dateType)
      .then(() => {
        return res.sendStatus(200);
      })
      .catch(next);
  });
};

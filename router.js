'use strict';

const DataRetentionWindowCalculator = require('./lib/data_retention_window_calculator');
const decodeEmail = email => email.includes('@') ? email : Buffer.from(email, 'hex').toString();

const setExpiryToRecords = (records, days, type) => {
  const calc = new DataRetentionWindowCalculator();

  return records.map(record => {
    const expiry = calc.getRetentionEndDate(days, type, record.created_at);
    record.expires_at = expiry;
    return record;
  });
};

module.exports = (app, props) => {
  const {
    modelName,
    tableName,
    additionalGetResources,
    selectableProps,
    dataRetentionInDays,
    dataRetentionPeriodType,
    enableMetrics
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
      .then(result => {
        let records = result;

        if (dataRetentionInDays) {
          records = setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType);
        }
        return res.json(records);
      })
      .catch(next);
  });

  if (enableMetrics) {
    app.get(`/${tableName}/metrics`, (req, res, next) => {
      return model.getMetrics()
        .then(result => {
          return res.json(result);
        })
        .catch(next);
    });
  }

  app.get(`/${tableName}/:id`, (req, res, next) => {
    return model.get({ id: req.params.id })
      .then(result => {
        let records = result;

        if (dataRetentionInDays) {
          records = setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType);
        }
        return res.json(records);
      })
      .catch(next);
  });

  if (additionalGetResources.includes('email')) {
    app.get(`/${tableName}/email/:email`, (req, res, next) => {
      return model.get({ email: decodeEmail(req.params.email) })
        .then(result => {
          let records = result;

          if (dataRetentionInDays) {
            records = setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType);
          }
          return res.json(records);
        })
        .catch(next);
    });
  }

  app.post(`/${tableName}`, (req, res, next) => {
    return model.create(req.body)
      .then(result => {
        let records = result;

        if (dataRetentionInDays) {
          records = setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType);
        }
        return res.json(records);
      })
      .catch(next);
  });

  app.patch(`/${tableName}/:id`, (req, res, next) => {
    return model.patch(req.params.id, req.body)
      .then(result => {
        let records = result;

        if (dataRetentionInDays) {
          records = setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType);
        }
        return res.json(records);
      })
      .catch(next);
  });

  app.delete(`/${tableName}/:id`, (req, res, next) => {
    return model.delete(req.params.id)
      .then(() => {
        return res.sendStatus(200);
      })
      .catch(next);
  });
};

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
    dataRetentionPeriodType
  } = props;

  const Model = require(`./models/${modelName}`);
  const model = new Model(tableName, selectableProps);

  app.get(`/${tableName}/:id`, (req, res, next) => {
    return model.get({ id: req.params.id })
      .then(result => {
        const records = result;

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
          const records = result;

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
        const records = result;

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
        const records = result;

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

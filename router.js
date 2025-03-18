'use strict';

const DataRetentionWindowCalculator = require('./lib/data_retention_window_calculator');
const { clearExpired } = require('./db');

const setExpiryToRecords = (records, days, type) => {
  const calc = new DataRetentionWindowCalculator();

  return records.map(record => {
    const expiry = calc.getRetentionEndDate(days, type, record.created_at);
    record.expires_at = expiry;
    return record;
  });
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
    dataRetentionPeriodType
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

  app.get(`/${tableName}/metrics`, (req, res, next) => {
    return model.getMetrics(req.query)
      .then(result => {
        return res.json(result);
      })
      .catch(next);
  });

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

  if (additionalGetResources) {
    additionalGetResources.forEach(resource => {
      app.get(`/${tableName}/${resource}/:${resource}`, (req, res, next) => {
        return model.get({ [resource]: decodeParam(resource, req.params[resource]) })
          .then(result => {
            let records = result;

            if (dataRetentionInDays) {
              records = setExpiryToRecords(records, dataRetentionInDays, dataRetentionPeriodType);
            }
            return res.json(records);
          })
          .catch(next);
      });
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

  app.delete(`/clear/:tableName/:columnName/older/:days/:period`, (req, res, next) => {
    const { tableName, columnName, days, period } = req.params;
    return clearExpired(tableName, columnName, days, period)
      .then(() => {
        return res.sendStatus(200);
      })
      .catch(next);
  });
};

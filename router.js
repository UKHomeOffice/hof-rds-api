
const decodeEmail = email => email.includes('@') ? email : Buffer.from(email, 'hex').toString();

module.exports = (app, props, db) => {
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
        return res.json(result);
      })
      .catch(next);
  });

  if (dataRetentionInDays) {
    app.get(`/${tableName}/:id/expiry`, (req, res, next) => {
      return model.get({ id: req.params.id })
        .then(result => {
          const expiry = db.getExpiryDate(result[0].created_at, dataRetentionPeriodType, dataRetentionInDays);
          return res.json({ expiry });
        })
        .catch(next);
    });
  }

  if (additionalGetResources.includes('email')) {
    app.get(`/${tableName}/email/:email`, (req, res, next) => {
      return model.get({ email: decodeEmail(req.params.email) })
        .then(result => {
          return res.json(result);
        })
        .catch(next);
    });
  }

  app.post(`/${tableName}`, (req, res, next) => {
    return model.create(req.body)
      .then(result => {
        return res.json(result);
      })
      .catch(next);
  });

  app.patch(`/${tableName}/:id`, (req, res, next) => {
    return model.patch(req.params.id, req.body)
      .then(result => {
        return res.json(result);
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

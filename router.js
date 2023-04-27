
const _ = require('lodash');

const decodeEmail = email => email.includes('@') ? email : Buffer.from(email, 'hex').toString();

module.exports = (app, props) => {
  const { modelName, tableName, additionalQueries, selectableProps } = props;

  const Model = require(`./models/${modelName}`);
  const model = new Model(tableName, selectableProps);

  app.get(`/${tableName}`, (req, res, next) => {
    let queries = ['id'];

    queries = queries.concat(additionalQueries || []).map(query => {
      return req.query[query] && { [query]: req.query[query] };
    }).filter(o => o);

    const queryProps = _.merge(...queries);

    if (queryProps.email) {
      queryProps.email = decodeEmail(queryProps.email);
    }

    if (!Object.keys(queryProps).length) {
      return res.send(404);
    }

    return model.get(queryProps)
      .then(res.json)
      .catch(next);
  });

  app.post(`/${tableName}`, (req, res, next) => {
    return model.create(req.body)
      .then(res.json)
      .catch(next);
  });

  app.patch(`/${tableName}/:id`, (req, res, next) => {
    return model.patch(req.params.id, req.body)
      .then(res.json)
      .catch(next);
  });

  app.delete(`/${tableName}/:id`, (req, res, next) => {
    return model.delete(req.params.id)
      .then(res.sendStatus(200))
      .catch(next);
  });
};

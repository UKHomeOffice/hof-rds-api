'use strict';

const moment = require('moment');

const testConfig = {
  env: 'test',
  bankHolidayApi: 'https://www.gov.uk/bank-holidays.json',
  serviceName: 'asc'
};

describe('Data Retention Window Calculator', () => {
  let DataRetentionWindowCalculator;
  let retentionCalculator;
  let axiosPipeStub;
  let writeStreamStub;

  beforeEach(async () => {
    axiosPipeStub = sinon.stub();
    writeStreamStub = sinon.stub();

    DataRetentionWindowCalculator = proxyquire('../lib/data_retention_window_calculator', {
      '../config': testConfig,
      // allows us to check config is stable for api and stream calls for bank holiday data
      axios: {
        get: sinon.stub()
          .withArgs(testConfig.bankHolidayApi,  { responseType: 'stream' })
          .resolves({ data: { pipe: axiosPipeStub } })
      },
      fs: {
        createWriteStream: writeStreamStub
          .withArgs('./data/bank_holidays.json')
          .returns('Data piped to write stream')
      },
      // allows tests to stub the time now if date not passed to calculator
      moment: date => date ? moment(date) : moment('2023-05-09')
    });

    retentionCalculator = new DataRetentionWindowCalculator();
  });

  afterEach(async () => {
    axiosPipeStub.reset();
    writeStreamStub.reset();
  });

  describe('#getRetentionStartDate', () => {
    it('gets a data retention start date based on calendar days if passing a single argument', () => {
      expect(retentionCalculator.getRetentionStartDate('14')).to.eql('2023-04-25');
    });

    it('gets a data retention start date based on calendar days if passing calendar period type', () => {
      expect(retentionCalculator.getRetentionStartDate('14', 'calendar')).to.eql('2023-04-25');
    });

    it('gets a data retention start date based on business days if passing calendar period type', () => {
      expect(retentionCalculator.getRetentionStartDate('14', 'business')).to.eql('2023-04-17');
    });

    it('gets a data retention start date based on date passed to it', () => {
      expect(retentionCalculator.getRetentionStartDate('14', 'business', '2022-12-30')).to.eql('2022-12-08');
    });
  });

  describe('#getRetentionEndDate', () => {
    it('gets a data retention end date based on calendar days if passing a single argument', () => {
      expect(retentionCalculator.getRetentionEndDate('14')).to.eql('2023-05-23');
    });

    it('gets a data retention end date based on calendar days if passing calendar period type', () => {
      expect(retentionCalculator.getRetentionEndDate('14', 'calendar')).to.eql('2023-05-23');
    });

    it('gets a data retention end date based on business days if passing calendar period type', () => {
      expect(retentionCalculator.getRetentionEndDate('14', 'business')).to.eql('2023-05-30');
    });

    it('gets a data retention end date based on date passed to it', () => {
      expect(retentionCalculator.getRetentionEndDate('14', 'business', '2022-12-30')).to.eql('2023-01-20');
    });
  });

  describe('#updateBankHolidaySheet', () => {
    it('updates the bank holiday sheet', async () => {
      await retentionCalculator.updateBankHolidaySheet();
      axiosPipeStub.should.have.been
        .calledOnce.calledWithExactly('Data piped to write stream');
    });
  });
});

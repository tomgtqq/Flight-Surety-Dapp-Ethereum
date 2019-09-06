
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

const truffleAssert = require('truffle-assertions');

contract('Flight Surety Tests', async (accounts) => {

  var config;

  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  let settingStatus;


  const TEST_ORACLES_COUNT = 20;
  let oracleIndexes = [];

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address,{from: config.owner});
  });

  /******************************************************************************************************/
  /* @test Operational: StartOperations and Settings contract is operational or not                     */
  /******************************************************************************************************/

  it(`(flightSuretyData) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(flightSuretyData) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(flightSuretyData) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false,{from: config.owner});
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

      await config.flightSuretyData.setOperatingStatus(true);
  });

  it(`(flightSuretyData) can block access to functions using requireIsOperational when operating status is false`, async function () {
      await config.flightSuretyData.setOperatingStatus(false);
      let reverted = false;
      try
      {
          let testMode = await config.flightSuretyData.setTestingMode(true);
          assert.equal(testMode, true, "Access not blocked for requireIsOperational");
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
  });
  it(`(flightSuretyAPP) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyApp.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(flightSuretyApp) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyApp.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(flightSuretyApp) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyApp.setOperatingStatus(false,{from: config.owner});
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

      await config.flightSuretyApp.setOperatingStatus(true);
  });

  it(`(flightSuretyApp) can block access to functions using requireIsOperational when operating status is false`, async function () {
      await config.flightSuretyApp.setOperatingStatus(false);
      let reverted = false;
      try
      {
          let testMode = await config.flightSuretyApp.setTestingMode(true);
          assert.equal(testMode, true, "Access not blocked for requireIsOperational");
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
      await config.flightSuretyApp.setOperatingStatus(true);
  });

  it('multi-party consensus to register airline', async function () {
        let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();
        let registerFaild = false;

        try{
            // register 1st airline
            await config.flightSuretyData.fund({from: accounts[1], value: fund});
            console.log(`register 1st airline: ${accounts[1]} name: ALN1 regiseted and funded`);

            // register 2nd airline
            await config.flightSuretyApp.createBallot(`ALN2`,accounts[2],{from: accounts[1]});

            await config.flightSuretyApp.registerAirline("ALN2",accounts[2],2,{from: accounts[1]});
            await config.flightSuretyData.fund({from: accounts[2] , value: fund});
            console.log(`register 2nd airline: ${accounts[2]} name: ALN2 regiseted and funded`);

            // register 3rd airline
            await config.flightSuretyApp.registerAirline("ALN3",accounts[3],3,{from: accounts[2]});
            await config.flightSuretyData.fund({from: accounts[3] , value: fund});
            console.log(`register 3rd airline: ${accounts[3]} name: ALN3 regiseted and funded`);

            // register 4th airline
            await config.flightSuretyApp.registerAirline("ALN4",accounts[4],4,{from: accounts[3]});
            await config.flightSuretyData.fund({from: accounts[4] , value: fund});
            console.log(`register 4th airline: ${accounts[4]} name: ALN4 regiseted and funded`);

            // register 5th airline
            await config.flightSuretyApp.createBallot(`ALN5`,accounts[5],{from: accounts[4]});

            await config.flightSuretyApp.vote(1,{from: accounts[4]});
            let result1 = await config.flightSuretyApp.getVoteInfo(1);
            console.log(`airline: ${accounts[4]} approve, votes:${result1[0]}/${result1[2]}`);

            await config.flightSuretyApp.vote(1,{from: accounts[3]});
            let result2 = await config.flightSuretyApp.getVoteInfo(1);
            console.log(`airline: ${accounts[4]} approve, votes:${result2[0]}/${result2[2]}`);

            await config.flightSuretyApp.vote(1,{from: accounts[2]});
            let result3 = await config.flightSuretyApp.getVoteInfo(1);
            console.log(`airline: ${accounts[4]} approve, votes:${result3[0]}/${result3[2]}`);

            await config.flightSuretyApp.vote(1,{from: accounts[1]});
            let result4 = await config.flightSuretyApp.getVoteInfo(1);
            console.log(`airline: ${accounts[4]} approve, votes:${result4[0]}/${result4[2]}`);

            await config.flightSuretyApp.registerAirline("ALN5",accounts[5],5,{from: accounts[2]});
            //await config.flightSuretyData.fund({from: accounts[5] , value: fund});
            console.log(`register 5th airline: ${accounts[5]} name: ALN5 regiseted and not funded`);
        }
        catch(e) {
            console.log(e);
            registerFaild = true;
        }
        // ASSERT
        assert.equal(registerFaild, false, "Regiseter Faild");
  });

    it('Airline can be registered, but does not participate in contract ', async function () {
            let registerFaild = false;

            try{
                await config.flightSuretyApp.createBallot(`ALN6`,accounts[6],{from: accounts[5]});
            }
            catch(e) {
                registerFaild = true;
            }
            // ASSERT
            assert.equal(registerFaild, true, "Can participate in contract");
        });

    it('Can participate in contract until it submits funding of 10 ether', async function () {
        let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();
        let operateFaild = false;

        try{
            await config.flightSuretyData.fund({from: accounts[5] , value: fund});
            console.log(`register 5th airline: ${accounts[5]} name: ALN5 submitted funding`);
            await config.flightSuretyApp.createBallot(`ALN6`,accounts[6],{from: accounts[5]});
        }
        catch(e) {
            operateFaild = true;
        }
        // ASSERT
        assert.equal(operateFaild, false, "Can't participate in contract");
    });

    it('Passengers can pay up to 1 ether for purchasing flight insurance', async function () {
        let fund =  await config.flightSuretyData.MIN_INSURED_VALUE.call();
        let operateFaild = false;

        let airline = "0x74F4b95b8DF892AC46B12755FafD517c416C75c9";
        let flight = "SK806";
        let timestamp = "2019090115350";
        let flightKey = await config.flightSuretyApp.getFlightKey(airline,flight,timestamp);
        try{
            await config.flightSuretyData.buyInsurance(
                                                airline,
                                                flight,
                                                timestamp,
                                                {from: accounts[7] , value: fund});
            let insurance = await config.flightSuretyData.checkInsurance(flightKey,accounts[7]);
            assert.equal(new BigNumber(fund).toString(), new BigNumber(insurance).toString(), "Insurance didn't equal payment");
        }
        catch(e) {
            console.error(e);
            operateFaild = true;
        }
        // ASSERT
        assert.equal(operateFaild, false, "Cann't buy insurance ,Operate Faild");
    });

    it('can register oracles', async () => {

        let reverted = false;
        try
        {
          // ARRANGE
          let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
          // ACT
          for(let a=1; a<=TEST_ORACLES_COUNT; a++) {
              await config.flightSuretyApp.registerOracle({from: accounts[a], value: fee});
              let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
              console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);

              oracleIndexes.push({
                        address: accounts[a],
                        indexes: [
                            new BigNumber(result[0]).toString(),
                            new BigNumber(result[1]).toString(),
                            new BigNumber(result[2]).toString()
                          ]
                    });
                }
          // Check balance
          let dataBalance = await config.flightSuretyData.balanceOf();
          console.log(`flightSuretyData contract balance: ${dataBalance}`);
        }
        catch(e) {
          console.error(e);
          reverted = true;
        }
        assert.equal(reverted, false, "cann't register oracles");

      });


    it('can request flight status', async function () {

        let airline = "0x74F4b95b8DF892AC46B12755FafD517c416C75c9";
        let flight = "SK806";
        let timestamp = "2019090115350";

        let resOracles=[];
        let reqIndex;

        const flightStatus = [
            STATUS_CODE_UNKNOWN,
            STATUS_CODE_ON_TIME,
            STATUS_CODE_LATE_AIRLINE,
            STATUS_CODE_LATE_WEATHER,
            STATUS_CODE_LATE_TECHNICAL,
            STATUS_CODE_LATE_OTHER
         ]

        //settingStatus = flightStatus[Math.floor(Math.random()*6)];
        settingStatus = STATUS_CODE_LATE_AIRLINE;

        let fetchTx = await config.flightSuretyApp.fetchFlightStatus(airline,flight,timestamp);

        truffleAssert.eventEmitted(fetchTx, 'OracleRequest', (ev) => {

            reqIndex = new BigNumber(ev.index).toString();

            resOracles = oracleIndexes.filter((oraclse)=>{
                return (oraclse.indexes[0] === reqIndex||oraclse.indexes[1] === reqIndex||oraclse.indexes[2] === reqIndex)
            });
            return true;
        });

        for (const oracle of resOracles){
             await config.flightSuretyApp.submitOracleResponse(
                                        reqIndex,
                                        airline,
                                        flight,
                                        timestamp,
                                        settingStatus,
                                        {from: oracle.address});
            }
        console.log(`Respond with random status code, now flight's status is ${settingStatus}`);
    });


    it('If Flight status is 20, the passenger receives credit of 1.5X the amount .Otherwise can not', async function () {

            let operateFaild = false;
            let airline = "0x74F4b95b8DF892AC46B12755FafD517c416C75c9";
            let flight = "SK806";
            let timestamp = "2019090115350";
            let flightKey = await config.flightSuretyApp.getFlightKey(airline,flight,timestamp);


            try{
                let insurance = await config.flightSuretyData.checkInsurance(flightKey,accounts[7]);
                // ASSERT
                await config.flightSuretyApp.appCreditInsurees(airline,flight,timestamp,{from: accounts[7]});

                let deposit =  await config.flightSuretyData.checkDeposit({from: accounts[7]});
                assert.equal(new BigNumber(insurance).toNumber()*1.5,  new BigNumber(deposit).toNumber(), "Cann't credit of 1.5X the amount of insurance");
            }
            catch(e) {
                console.error(e);
                operateFaild = true;
            }
        if(settingStatus === STATUS_CODE_LATE_AIRLINE){
            // ASSERT
                assert.equal(operateFaild, false, "Cann't credit of 1.5X the amount ,Operate Faild");
        }else{
                assert.equal(operateFaild, true, "The Flight status isn't STATUS_CODE_LATE_AIRLINE, Can't credit");
        }
    });

    it('If Flight status is 20, the passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout. Otherwise can not', async function () {
            let operateFaild = false;
            let airline = "0x74F4b95b8DF892AC46B12755FafD517c416C75c9";
            let flight = "SK806";
            let timestamp = "2019090115350";
            let flightKey = await config.flightSuretyApp.getFlightKey(airline,flight,timestamp);
            let amount = web3.utils.toWei("1", "ether");

            let originalInsurance = await config.flightSuretyData.checkInsurance(flightKey,accounts[7]);
            let originalDeposit = await config.flightSuretyData.checkDeposit({from:accounts[7]});
            let originalBalance = await config.flightSuretyData.balanceOf();

            console.log(`originalInsurance:${originalInsurance}`);
            console.log(`originalDeposit:${originalDeposit}`);
            console.log(`originalBalance:${originalBalance}`);

            try{
                await config.flightSuretyData.safeWithdraw(amount,{from: accounts[7]});
            }
            catch(e)
            {
                console.error(e);
                operateFaild = true;
            }

            let nowDeposit = await config.flightSuretyData.checkDeposit({from:accounts[7]});
            let nowBalance = await config.flightSuretyData.balanceOf();

            console.log(`nowDeposit:${nowDeposit}`);
            console.log(`nowBalance:${nowBalance}`);
            if(settingStatus === STATUS_CODE_LATE_AIRLINE){
                // ASSERT
                assert.equal(new BigNumber(originalBalance).toNumber() - new BigNumber(nowBalance).toNumber(),
                                amount,
                                "Balance is not right");

                assert.equal(operateFaild, false, "Cann't withdraw ,Operate Faild");

            }else{
                assert.equal(operateFaild, true, "The Flight status isn't STATUS_CODE_LATE_AIRLINE");
            }
     });
})

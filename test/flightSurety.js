
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
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
            await config.flightSuretyData.buyInsurance(flightKey,{from: accounts[7] , value: fund});
            let insurance = await config.flightSuretyData.checkInsurance(flightKey,{from: accounts[7]});
            assert.equal(fund, new BigNumber(insurance).toNumber(), "Insurance didn't equal payment");  
        }
        catch(e) {
            console.error(e);
            operateFaild = true;
        }
        // ASSERT
        assert.equal(operateFaild, false, "Cann't buy insurance ,Operate Faild");  
    });

    it('Passenger receives credit of 1.5X the amount,When flight is delayed to airline fault', async function () {
        
        let operateFaild = false;
        let airline = "0x74F4b95b8DF892AC46B12755FafD517c416C75c9";
        let flight = "SK806";
        let timestamp = "2019090115350";

        try{
              await config.flightSuretyApp.fetchFlightStatus(airline,flight,timestamp);

            for(let a=1; a<=20; a++) {
                let oracleIndexes  = await config.flightSuretyApp.getMyIndexes({from: accounts[a]});
                console.log(`oracleIndexes: ${oracleIndexes[0]} ${oracleIndexes[1]} ${oracleIndexes[2]}`);
                for(let idx=0;idx<3;idx++) {
                        await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx],airline,flight,timestamp, STATUS_CODE_LATE_AIRLINE, {from: accounts[a]});
                    }
                }
            // ASSERT     
            let insurance = await config.flightSuretyData.checkInsurance(flightKey,{from: accounts[7]});
            let deposit =  await config.flightSuretyData.checkDeposit({from: accounts[7]});
            
            assert.equal(new BigNumber(insurance).toNumber()*1.5,  new BigNumber(deposit).toNumber(), "Cann't credit of 1.5X the amount of insurance");  
        }
        catch(e) {
            console.error(e);
            operateFaild = true;
        }
        // ASSERT
        assert.equal(operateFaild, false, "Cann't credit of 1.5X the amount ,Operate Faild");  
    });
});

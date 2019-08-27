
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    //await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
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

  it('(flightSuretyData) register first airline', async function () {
        let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();
        let id = Number(0);
        let registerFaild = false;
        try{
            await config.flightSuretyData.fund({from: config.owner , value: fund}); 

            // create vote for register first airline
            await config.flightSuretyData.createBallot("FAL",config.firstAirline)
            await config.flightSuretyData.vote(id)

            // register first airline
            await config.flightSuretyData.registerAirline("FAL",config.firstAirline,id, {from: config.owner});
            await config.flightSuretyData.fund({from: config.firstAirline , value: fund});    
        }
        catch(e) {
            registerFaild = true;
        }
        // ASSERT
        assert.equal(registerFaild, false, "Regiseter Faild");
  });

  it('(flightSuretyData) register second airline', async function () {
        let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();
        let id = Number(1);
        let registerFaild = false;
        try{
            // create vote for register second airline
            await config.flightSuretyData.createBallot("SAL",config.secondAirline)
            await config.flightSuretyData.vote(id)
            // register second airline
            await config.flightSuretyData.registerAirline("SAL",config.secondAirline,id,{from: config.firstAirline});
            await config.flightSuretyData.fund({from: config.secondAirline , value: fund});
        }
        catch(e) {
            registerFaild = true;
        }
        // ASSERT
        assert.equal(registerFaild, false, "Regiseter Faild");
  });

  it('(flightSuretyData) register third airline', async function () {
    
    let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();
    let id = Number(2);
    let registerFaild = false;

    try{
        // create vote for register third airline
        await config.flightSuretyData.createBallot("TAL",config.thirdAirline)
        await config.flightSuretyData.vote(id)
        // register third airline
        await config.flightSuretyData.registerAirline("TAL",config.thirdAirline,id, {from: config.secondAirline});
        await config.flightSuretyData.fund({from: config.thirdAirline , value: fund});
    }
    catch(e) {
        registerFaild = true;
    }
    // ASSERT
    assert.equal(registerFaild, false, "Regiseter Faild");

  });

  it('(flightSuretyData) register fourth airline', async function () {
    let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();
    let id = Number(3);
    let registerFaild = false;
    try{
        // create vote for register fourth airline
        await config.flightSuretyData.createBallot("FOAL",config.fourthAirline)
        await config.flightSuretyData.vote(id)
        // register fourth airline
        await config.flightSuretyData.registerAirline("FOAL",config.fourthAirline,id, {from: config.thirdAirline});
        await config.flightSuretyData.fund({from: config.fourthAirline , value: fund});
    }
    catch(e) {
        registerFaild = true;
    }
    // ASSERT
    assert.equal(registerFaild, false, "Regiseter Faild");
  });

  it('(flightSuretyData) register more then four airlines, voting to approve', async function () {
   
    let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();    
    let id = Number(4);
    let registerFaild = false;

    try{
            // create vote for register fourth airline
            await config.flightSuretyData.createBallot("FIAL",config.fifthAirline);
            await config.flightSuretyData.vote(id);
            
            // Multi-party consensus , voting
            await config.flightSuretyData.vote(id,{from: config.firstAirline});
            await config.flightSuretyData.vote(id,{from: config.secondAirline});
            await config.flightSuretyData.vote(id,{from: config.thirdAirline});

            // register fifth airline
            await config.flightSuretyData.registerAirline("FIAL",config.fifthAirline,id, {from: config.fourthAirline});
            await config.flightSuretyData.fund({from: config.fifthAirline , value: fund});

        }
    catch(e) {
                console.error(e);
                registerFaild = true;
             }
        assert.equal(registerFaild, false, "Regiseter Faild");
                    
  });

  it('(flightSuretyData) register more then four airlines, can not register directly', async function () {
   
    let fund =  await config.flightSuretyData.REGISTRATION_FUND.call();    
    let id = Number(4);
    let registerFaild = false;

    try{
            // create vote for register fourth airline
            await config.flightSuretyData.createBallot("FIAL",config.fifthAirline);
            await config.flightSuretyData.vote(id);
            
            // register fifth airline
            await config.flightSuretyData.registerAirline("FIAL",config.fifthAirline,id, {from: config.fourthAirline});
            await config.flightSuretyData.fund({from: config.fifthAirline , value: fund});

        }
    catch(e) {
                registerFaild = true;
             }
        assert.equal(registerFaild, true, "Can register directly");
                    
  });

  /*************************/
  /* @test Operational end */
  /*************************/  

//   it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
//     // ARRANGE
//     let newAirline = accounts[2];

//     // ACT
//     try {
//         await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
//     }
//     catch(e) {

//     }
//     let result = await config.flightSuretyData.isAirline.call(newAirline); 

//     // ASSERT
//     assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

//   });
 

});

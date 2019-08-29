import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import flightSchedules from './flightSchedules.json';


// Flight status codees
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

// Register 20 ORACLES
const ORACLES_COUNT = 20;


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

// Register oracles staking
const fee = await flightSuretyApp.REGISTRATION_FEE.call();
// Save oracles index values
let oracleIndexes = [];

// Register oracles 
for(let a=1; a<ORACLES_COUNT; a++) {
   try{
        await flightSuretyApp.registerOracle({ from: web3.eth.accounts[a], value: fee });
        let result = await flightSuretyApp.getMyIndexes.call({from: accounts[a]});
        console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
        oracleIndexes[web3.eth.accounts[a]] = result;
      }
    catch(e) {
        console.error(e);
    }
}

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) console.log(error)
    console.log(event)
    
    let account = oracleIndexes.filter((indexes,address)=>{
        if(indexes[0]=== event.index||indexes[1]=== event.index||indexes[2]=== event.index)
        return address});

    try {
      // Submit a response...it will only be accepted if there is an Index match
      await flightSuretyApp.submitOracleResponse(event.index, event.airline, event.flight, event.timestamp, STATUS_CODE_LATE_AIRLINE, {from: account});
    }
    catch(e) {
      // Enable this when debugging
        console.error(e);
        console.log('\nError', event.index, event.airline, event.timestamp,account);
    }
});


const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })

app.get('/flightschedules',(req,res)=>{
    res.status(200).json(flightSchedules);
    })    
})

export default app;



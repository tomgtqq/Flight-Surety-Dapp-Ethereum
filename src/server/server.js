import 'babel-polyfill';
import FlightSuretyApp from '../../build/contracts/flightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import flightSchedules from './flightSchedules.json';
import BigNumber from 'bignumber.js';


// Flight status codees
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const flightStatus = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER 
]



const ORACLES_COUNT = 20;

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);


let oracleIndexes = [];

const registerOracle = async () => {
    const accounts = await web3.eth.getAccounts();
    let staking = await flightSuretyApp.methods.REGISTRATION_FEE().call();
    console.log(`staking:${staking}`);
    try{
        // Register oracles 
        for(let a=1; a<=ORACLES_COUNT; a++) {
                await flightSuretyApp.methods.registerOracle()
                .send({
                        from: accounts[a], 
                        value: staking,
                        gas:30000000000,
                        gasPrice:100000
                      });
                let result = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[a]});
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

              console.log(`OracleRequest registerOracle : ${JSON.stringify(oracleIndexes, null, 4)}`);
            }
    catch(e) {
         console.error(e);
    }      
}

registerOracle();

flightSuretyApp.events.OracleRequest({
    fromBlock: "latest"
  }, async (error, event) => {
    if (error) console.log(error)
    console.log(event)

    let reqIndex = new BigNumber(event.returnValues.index).toString();
    console.log(`OracleRequest reqIndex : ${reqIndex}`);
    let resOracles = oracleIndexes.filter((oraclse)=>{
        return (oraclse.indexes[0] === reqIndex||oraclse.indexes[1] === reqIndex||oraclse.indexes[2] === reqIndex)
    });
    let statusCode = new BigNumber(flightStatus[Math.floor(Math.random()*6)]).toString();
    //let statusCode = new BigNumber(20).toString();
    console.log(`OracleRequest resOracles : ${JSON.stringify(resOracles, null, 4)}`);

    for (const oracle of resOracles){  
          try {
            console.log(`OracleRequest oracle : ${JSON.stringify(oracle, null, 4)}`);
            // Submit a response...it will only be accepted if there is an Index match
            await flightSuretyApp.methods.submitOracleResponse( 
                    reqIndex, 
                    event.returnValues.airline, 
                    event.returnValues.flight, 
                    event.returnValues.timestamp, 
                    statusCode, 
                    ).send({from: oracle.address,
                            gas:30000000000,
                            gasPrice:100000});
          }
          catch(e) {
              console.error(e);
              console.log('\nNot match Oracles', reqIndex, event.returnValues.airline, event.returnValues.timestamp,oracle.address);
          }
        }
});

flightSuretyApp.events.OracleReport({
  fromBlock: "latest"
}, async (error, event) => {
  if (error) console.log(error)
  console.log(JSON.stringify(event));
})

flightSuretyApp.events.FlightStatusInfo({
  fromBlock: "latest"
}, async (error, event) => {
  if (error) console.log(error)
  console.log(JSON.stringify(event));
  let status = event.returnValues.status;
  let flight = event.returnValues.flight;
  console.log(status,flight);
})



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



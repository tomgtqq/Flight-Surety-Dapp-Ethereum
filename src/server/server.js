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
            }
    catch(e) {
         console.error(e);
    }      
}

registerOracle();

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, async (error, event) => {
    if (error) console.log(error)
    console.log(event)

    let reqIndex = new BigNumber(event.index).toString();

    let resOracles = oracleIndexes.filter((oraclse)=>{
        return (oraclse.indexes[0] === reqIndex||oraclse.indexes[1] === reqIndex||oraclse.indexes[2] === reqIndex)
    });

    for (const oracle of resOracles){  
          try {
            // Submit a response...it will only be accepted if there is an Index match
            await flightSuretyApp.methods.submitOracleResponse( 
                    event.index, 
                    event.airline, 
                    event.flight, 
                    event.timestamp, 
                    flightStatus[Math.floor(Math.random()*6)], 
                    {from: oracle.address});
          }
          catch(e) {
            // Enable this when debugging
              console.log('\nNot match Oracles', event.index, event.airline, event.timestamp,oracle.address);
          }
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



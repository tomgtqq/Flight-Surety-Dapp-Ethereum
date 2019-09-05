import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import {
    log
} from 'util';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        //this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));

        // this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress, {gas: 4712388,gasPrice: 100000000000});
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

        this.appAddress = config.appAddress;
        this.owner = null;
        this.accounts = null;
        this.passengers = [];
        this.airlines = [{
            name: "Sas",
            airline: '0x74F4b95b8DF892AC46B12755FafD517c416C75c9',
            isRegistered: true,
            isFunded: false
        }]
        this.fundAmount = Web3.utils.toWei("10", "ether");
        this.initialize(callback);
    }

    initialize(callback) {
        this.web3.eth.getAccounts(async (err, accts) => {
            this.owner = accts[0];
            this.accounts = accts;
            let counter = 5;

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback(err, accts);
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({
                from: self.owner
            }, callback);
    }

    async fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        let status = null;
        await self.flightSuretyApp.methods
            .fetchFlightStatus(airline, flight, timestamp)
            .send({
                from: self.passengers[1]
            });
        callback()
    }

    eventFlightStatusInfo() {
        return new Promise((reslove, reject) => {
            this.flightSuretyApp.events.FlightStatusInfo({
                fromBlock: "latest"
            }, (error, event) => {
                if (error) {
                    reject(error)
                    console.log(error)
                }
                console.log(event.returnValues.status);
                reslove(event.returnValues.status);
            })
        })
    }

    authorizeContract(appAddress, callback) {
        let self = this;
        self.flightSuretyData.methods
            .authorizeContract(appAddress)
            .send({
                from: self.owner
            }, callback);
    }

    async setOperatingStatus(mode, callback) {
        let self = this;
        await self.flightSuretyData.methods
            .setOperatingStatus(mode)
            .send({
                from: self.owner
            }, (error, result) => {
                console.log(error, result);
                if (!error) {
                    'Setting flightSuretyData Successfully'
                }
                self.flightSuretyApp.methods
                    .setOperatingStatus(mode)
                    .send({
                        from: self.owner
                    }, (error, result) => {
                        callback(error, result)
                    });
            });
    }

    async fund(acct, callback) {
        let self = this;
        await self.flightSuretyData.methods.fund()
            .send({
                from: acct,
                value: self.fundAmount,
                gas: 30000000000,
                gasPrice: 100000
            }, (error, result) => {
                if (!error) {
                    alert("Fund successfully");
                    for (let i = 0; i < self.airlines.length; i++) {
                        if (self.airlines[i].airline === acct) {
                            self.airlines[i].isFunded = true;
                        }
                    }
                }
                callback(error, result);
            })
    }

    async registerAirline(name, airline, id, acct, callback) {
        let self = this;
        let payload = {
            name: name,
            airline: airline,
            isRegistered: true,
            isFunded: false
        }
        await self.flightSuretyApp.methods.registerAirline(name, airline, id).send({
            from: acct,
            gas: 30000000000,
            gasPrice: 100000
        }, (error, result) => {
            if (!error) {
                alert("Register Successfully");
                self.airlines.push(payload);
            }
            callback(error, result);
        });
    }

    async createBallot(name, airline, acct, callback) {
        let self = this;
        await self.flightSuretyApp.methods.createBallot(name, airline)
            .send({
                from: acct,
                gas: 30000000000,
                gasPrice: 100000
            }, (error, result) => {
                if (!error) {
                    alert("Create Ballot Successfuly")
                }
                callback(error, result);
            });
    }

    async getAirlinesAmount(acct, callback) {
        let self = this;
        await self.flightSuretyData.methods
            .getAirlinesAmount()
            .call({
                from: acct
            }, (error, result) => {
                if (error) {
                    console.error(error)
                    alert('Get airlines amount fail')
                }
                callback(error, result)
            });
    }

    async vote(ballotId, acct, callback) {
        let self = this;
        await self.flightSuretyApp.methods.vote(ballotId).send({
            from: acct,
            gas: 30000000000,
            gasPrice: 100000
        }, (error, result) => {
            if (!error) {
                alert('Vote successfully')
            }
            callback(error, result)
        });
    }

    async getVoteInfo(ballotId, acct) {
        let self = this;
        await self.flightSuretyApp.methods.getVoteInfo(ballotId)
            .call({
                from: acct
            });
    }

    async getNextBallotId(callback) {
        let self = this;
        await self.flightSuretyApp.methods.getNextBallotId()
            .call({
                from: self.accounts[1]
            }, (error, result) => {
                callback(error, result)
            });
    }

    async buyInsurance(airline, flight, timestamp, value, callback) {
        let self = this;
        console.log(`buyInsurance ${airline} ${flight} ${timestamp}`);
        await self.flightSuretyData.methods.buyInsurance(airline, flight, timestamp)
            .send({
                from: self.passengers[1],
                value: Web3.utils.toWei(`${value}`, "ether"),
                gas: 30000000000,
                gasPrice: 100000
            }, (error, result) => {
                if (!error) {
                    alert("Buy Insurance successfully");
                }
                callback(error, result);
            })
    }

    async appCreditInsurees(airline, flight, timestamp, callback) {
        let self = this;
        console.log(`appCreditInsurees ${airline} ${flight} ${timestamp}`);
        await self.flightSuretyData.methods.buyInsurance(airline, flight, timestamp)
        self.flightSuretyApp.methods.appCreditInsurees(airline, flight, timestamp)
            .send({
                from: self.passengers[1],
                gas: 30000000000,
                gasPrice: 100000
            }, (error, result) => {
                if (error) console.log(error);
                callback(error, result);
            })
    }

    async checkDeposit(callback) {
        let self = this;
        console.log('checkDeposit');
        await self.flightSuretyData.methods.checkDeposit()
            .call({
                from: self.passengers[1],
                gas: 30000000000,
                gasPrice: 100000
            }, (error, result) => {
                if (error) console.log(error);
                console.log(`checkDeposit value:${result}`);
                callback(error, web3.fromWei(result, 'ether'));
            })
    }

    async safeWithdraw(amount, callback) {
            let self = this;
            let value = Web3.utils.toWei(`${amount}`, "ether");
            console.log(`The passenger:${self.passengers[1]}  safeWithdraw: ${value}`);
            this.flightSuretyData.methods.safeWithdraw(value)
            .send({
                from: self.passengers[1],
                gas: 30000000000,
                gasPrice: 100000
            }, (error, result) => {
                if (!error) alert(`Withdraw ${amount} ether successfully`);
                console.log(error, result);
                callback(error, result);
            })
    }
}
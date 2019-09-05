import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async () => {

    let result = null;
    const flightSchedules = {
        "Sas": {
            "flight": "SK806",
            "dCity": "LHR  London London Heathrow Airport T2",
            "aCity": "EWR  New York Newark Liberty International Airport B",
            "departCNDate": "2019-10-10 15:35:00",
            "arrivalCNDate": "2019-10-11 13:15:00",
            "status": "",
            "airline": "0x74F4b95b8DF892AC46B12755FafD517c416C75c9"
        },
        "Aeroflot": {
            "flight": "SU2583",
            "dCity": "LHR  London London Heathrow Airport T4",
            "aCity": "JFK  New York John F. Kennedy International Airport T1",
            "departCNDate": "2019-10-10 17:15:00",
            "arrivalCNDate": "2019-10-11 13:15:00",
            "status": "",
            "airline": "0x35374ff150756cec63f7909b5053cd49bD26dE33"
        },
        "Aer Lingus": {
            "flight": "AL2583",
            "dCity": "LHR  London London Heathrow Airport T2",
            "aCity": " JFK  New York John F. Kennedy International Airport T5",
            "departCNDate": "2019-10-10 14:45:00",
            "arrivalCNDate": "2019-10-11 10:15:00",
            "status": "",
            "airline": "0xD44D382588859aEE64f928EC542aA11590375FF8"
        },
        "Easy Jet": {
            "flight": "U23151",
            "dCity": "STN  London Stansted Airport ",
            "aCity": "CDG  Paris Charles De Gaulle Airport T2D",
            "departCNDate": "2019-10-10 07:00:00",
            "arrivalCNDate": "2019-10-10 09:20:00",
            "status": "",
            "airline": "0xF3aFb4cc5e2d27Acd07747EE1367FA092419d4B4"
        },
        "Air China": {
            "flight": "CA788",
            "dCity": "LHR  London London Heathrow Airport T2",
            "aCity": "PEK  Beijing Beijing Capital International Airport T3",
            "departCNDate": "2019-10-10 15:00:00",
            "arrivalCNDate": "2019-10-10 08:15:00",
            "status": "",
            "airline": "0xf9aaDAA2A24522c8B89226e45D0cB2387a23d769"
        },
        "Swiss": {
            "flight": "LX461",
            "dCity": "LCY  London London City Airport",
            "aCity": "PEK  Beijing Beijing Capital International Airport T3",
            "departCNDate": "2019-10-10 10:00:00",
            "arrivalCNDate": "2019-10-10 12:05:15",
            "status": "",
            "airline": "0xb1Ff48dAAdC28e9376137A4C46fa76b83baa24c0"
        }
    };

    let flightStatus = new Map([
        [0, 'UNKNOW'],
        [10, 'ON TIME'],
        [20, 'LATE DUE TO AIRLINE'],
        [30, 'LATE DUE TO WEATHER'],
        [40, 'LATE DUE TO TECHNICAL'],
        [50, 'LATE DUE TO OTHER'],
    ]);

    let contract = new Contract('localhost', (err, accts) => {

        const accounts = accts;
        let agree = 0;
        let amountVotes = 0;

        // Select contract address
        DOM.elid("logic-contract-address").appendChild(
            DOM.createOption(
                contract.appAddress.slice(0, 8).padEnd(36, '*').concat(contract.appAddress.slice(-6)), `${contract.appAddress}`)
        );

        // Authorize
        DOM.elid('authorize-contract').addEventListener('click', () => {
            let e = DOM.elid('logic-contract-address');
            let value = e.options[e.selectedIndex].value
            console.log(value);

            contract.authorizeContract(value, (error, result) => {
                console.log(error, result);
                if (!error) {
                    alert('Authorized')
                } else {
                    alert('Authorized Fail')
                }
            });
        });

        // Set Contract Operational status
        DOM.elid('operationalStatusOpen').addEventListener('click', () => {
            contract.isOperational((error, result) => {
                console.log(error, result);
                if (result == true) {
                    DOM.elid('operationalStatusOpen').checked = true;
                } else {
                    contract.setOperatingStatus(true, (error, result) => {
                        console.log(error, result);
                        if (!error) {
                            alert('Success')
                        } else {
                            alert('Fail')
                        }
                    });
                }
            });
        });

        DOM.elid('operationalStatusClose').addEventListener('click', () => {
                    contract.setOperatingStatus(false, (error, result) => {
                        console.log(error, result);
                        if (!error) {
                            alert('Setting successful')
                        } else {
                            alert('Setting Fail')
                        }
                    });
        });

        DOM.elid('airline1').addEventListener('click', () => {
            // Fund 1st airline
            contract.fund(accounts[1], (error, result) => {
                console.log(error, result);
                if (!error) {
                    console.log(`${accounts[1]} Sas funded`);
                    alert('Successfully fund 1st airline')
                }else{
                    alert("Can't register new airline");
                }
            })
        })

        DOM.elid('airline2').addEventListener('click', () => {
            console.log("register and fund 2nd airline");
            // register 2nd airline
            contract.registerAirline("Aeroflot", flightSchedules["Aeroflot"].airline, 0, accounts[1],
                (error, result) => {
                    if (!error) {
                        console.log(`${flightSchedules["Aeroflot"].airline} Aeroflot registered`);
                        contract.fund(accounts[2], (error, result) => {
                            if (!error) {
                                console.log(`${flightSchedules["Aeroflot"].airline} Aeroflot Funded`);
                                alert('Successfully register and fund 2nd airline')
                            } else {
                                alert('Fail')
                            }
                        })
                    } else {
                        alert("Can't register new airline");
                    }
                })
        })

        DOM.elid('airline3').addEventListener('click', () => {
            console.log("register and fund 3rd airline");
            // register 3rd airline
            contract.registerAirline("Aer Lingus", flightSchedules["Aer Lingus"].airline, 0, accounts[1],
                (error, result) => {
                    if (!error) {
                        console.log(`${flightSchedules["Aer Lingus"].airline} Aer Lingus registered`);
                        contract.fund(accounts[3], (error, result) => {
                            if (!error) {
                                console.log(`${flightSchedules["Aer Lingus"].airline} Aer Lingus Funded`);
                                alert('Successfully register and fund 3rd airline')
                            } else {
                                alert('Fail')
                            }
                        })
                    } else {
                        alert("Can't register new airline");
                    }
                })
        })

        DOM.elid('airline4').addEventListener('click', () => {
            console.log("register and fund 4rd airline");
            // register 3rd airline
            contract.registerAirline("Easy Jet", flightSchedules["Easy Jet"].airline, 0, accounts[1],
                (error, result) => {
                    if (!error) {
                        console.log(`${flightSchedules["Easy Jet"].airline} Easy Jet registered`);
                        contract.fund(accounts[4], (error, result) => {
                            if (!error) {
                                console.log(`${flightSchedules["Easy Jet"].airline} Easy Jet Funded`);
                                alert('Successfully register and fund 4rd airline')
                            } else {
                                alert('Fail')
                            }
                        })
                    } else {
                        alert("Can't register new airline");
                    }
                })
        })

        DOM.elid('create-ballot').addEventListener('click', () => {
            console.log("Create ballot");

            for (let i = 0; i < contract.airlines.length; i++) {
                DOM.elid("registered-airline").appendChild(
                    DOM.createOption(contract.airlines[i].name, contract.airlines[i].name)
                );
                console.log(`Registered airlines ${contract.airlines[i].name}`)
            }

            contract.getAirlinesAmount(accounts[1], (error, result) => {
                console.log(error, result);
                amountVotes = result;
            })

            let name = DOM.elid('airline-name-id').value;
            let airline = DOM.elid('airline-address-id').value;
            if (!name.trim().length) {
                alert("Please enter the airline's name");
            }
            if (!airline.trim().length) {
                alert("Please enter the airline's address");
            }
            // create Ballot
            contract.createBallot(name, airline, accounts[1],
                (error, result) => {
                    console.log(error, result);
                    if (!error) {
                        alert(`VOTES ${agree}/${amountVotes}`);
                    } else {
                        alert('Create ballot fail');
                    }
                })
        })

        DOM.elid('register-vote').addEventListener('click', () => {
            console.log("vote for new airline");

            let e = DOM.elid('registered-airline');
            let name = e.options[e.selectedIndex].value
            console.log("DOM.elid('registered-airline').e.options[e.selectedIndex].value", name);
            let airline = flightSchedules[name].airline;
            console.log("flightSchedules[name]", airline);

            let rate = Math.round((agree / amountVotes) * 100);

            console.log(`The rate is ${rate*100}%`);

            contract.getNextBallotId((error, result) => {
                console.log(error, result);
                let ballotId = result - 1;
                contract.vote(ballotId, airline, (error, result) => {
                    if (!error) {
                        agree++
                        alert(rate > 0.5 ? "You get enough votes to register " : `VOTES ${agree}/${amountVotes}`);
                    } else {
                        alert('The Voter can only vote once for a ballot.');
                    }
                })
            })
        })


        DOM.elid('register-airline').addEventListener('click', () => {
            console.log("Register a airline that has been voted to agree");

            let name = DOM.elid('airline-name-id').value;
            let airline = DOM.elid('airline-address-id').value;

            if (!name.trim().length) {
                alert("Please enter the airline's name");
            }
            if (!airline.trim().length) {
                alert("Please enter the airline's address");
            }

            contract.getNextBallotId((error, result) => {
                console.log(error, result);
                let ballotId = (result - 1);
                contract.registerAirline(name, airline, ballotId, accounts[1],
                    (error, result) => {
                        if (!error) {
                            console.log(`${airline} ${name} registered`);
                            contract.fund(airline, (error, result) => {
                                if (!error) {
                                    console.log(`${airline} ${name} Funded`);
                                    alert(`Successfully register and fund a new airline`)
                                } else {
                                    alert('Fail')
                                }
                            })
                        } else {
                            alert('Airline is already registered');
                        }
                    })
            })
        })

        DOM.elid("select-flight").onchange = () => {
            console.log('Select flight to buy insurance');
            let e = DOM.elid("select-flight");
            let flightNumber = e.options[e.selectedIndex].value
            if (e.selectedIndex > 0) {
                let flight = search(flightNumber, Object.values(flightSchedules));
                flight['departCNDate'] = convertDate(flight['departCNDate']);
                flight['arrivalCNDate'] = convertDate(flight['arrivalCNDate']);
                console.log(flightNumber);
                console.log(`flight ${JSON.stringify(flight, null, 4)}`);

                DOM.setText(DOM.elid("flightSchedules-flight"), flight['flight'])
                DOM.setText(DOM.elid("flightSchedules-from"), flight['dCity'])
                DOM.setText(DOM.elid("flightSchedules-to"), flight['aCity'])
                DOM.setText(DOM.elid("flightSchedules-departTime"), flight['departCNDate'])
                DOM.setText(DOM.elid("flightSchedules-arrivalTime"), flight['arrivalCNDate'])

            }
        }
        DOM.elid('buy-insures').addEventListener('click', () => {
            console.log("buy insures");
            let e = DOM.elid('select-flight');
            let flightNumber = e.options[e.selectedIndex].value
            let flightSchedule = search(flightNumber, Object.values(flightSchedules));
            let airline = flightSchedule.airline;
            let flight = flightSchedule.flight;

            let date = flightSchedule.departCNDate;
            let timestamp = (date.getTime() / 1000); //Convert UNXI timeStamp

            let value = DOM.elid("buyInsuranceValue").value;
            console.log(airline, flight, timestamp, value);

            if (value.trim().length) {
                contract.buyInsurance(airline, flight, timestamp, value,
                    (error, result) => {
                        console.log(error, result);
                        if (error) {
                            alert('Buy Insurance fail')
                        }
                    })
            } else {
                alert("Please enter value");
            }
        })

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{
                label: 'Operational Status',
                error: error,
                value: result
            }]);
            let flights = Object.values(flightSchedules);
            let flightNumber = searchFlightNumbers(flights);

            for (let i = 0; i < flightNumber.length; i++) {
                DOM.elid("select-flight").appendChild(
                    DOM.createOption(flightNumber[i], flightNumber[i])
                );
                DOM.elid("FlightUpdate-select").appendChild(
                    DOM.createOption(flightNumber[i], flightNumber[i])
                );
            }
        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            console.log('Fetch the flight stauts');
            let e = DOM.elid('FlightUpdate-select');
            let flightNumber = e.options[e.selectedIndex].value
            let flightSchedule = search(flightNumber, Object.values(flightSchedules));
            let airline = flightSchedule.airline;
            let flight = flightSchedule.flight;

            let date = flightSchedule.departCNDate;
            let timestamp = (date.getTime() / 1000); //Convert UNXI timeStamp

            console.log(airline, flight, timestamp);

            //Write transaction
            contract.fetchFlightStatus(airline, flight, timestamp, (error, result) => {
                contract.eventFlightStatusInfo().then((result) => {
                        let status = flightStatus.get(Number(result));
                        let title = (Number(result) == 20) ? "Claim insurance" : "Can't claim insrurance"
                        console.log(status, result);
                        display(title, 'Trigger oracles', [{
                            label: 'Fetch Flight Status',
                            error: error,
                            value: `The ${flight}'s status is ${status}`
                        }]);
                    })
                    .catch((err) => {
                        alert('Fetch Flight Status fail')
                    })
            });
        });

        // Claim insurance
        DOM.elid('claim-insures').addEventListener('click', async () => {
            console.log('Claim insurance');

            let e = DOM.elid('FlightUpdate-select');
            let flightNumber = e.options[e.selectedIndex].value
            let flightSchedule = search(flightNumber, Object.values(flightSchedules));
            let airline = flightSchedule.airline;
            let flight = flightSchedule.flight;

            let date = flightSchedule.departCNDate;
            let timestamp = (date.getTime() / 1000); //Convert UNXI timeStamp

            console.log(airline, flight, timestamp);
            if (!airline || !flight || !timestamp) {
                alert('Please first selected flight had been updated');
                return;
            }
            contract.appCreditInsurees(airline, flight, timestamp, (error, result) => {
                console.log(error, result);
                contract.checkDeposit((error, result) => {
                    if (error) {
                        console.log(error);
                        alert('Buy Insurance fail');
                        return;
                    }
                    DOM.setText(DOM.elid("credit-values"), result);
                });
            });
        });
        // WithDraw insurance
        DOM.elid('with-draw').addEventListener('click', () => {
            console.log('WithDraw insurance');
            let amount = DOM.elid("WithDrawAmount").value;
            console.log(amount);
            contract.safeWithdraw(amount,(error, result) => {
                console.log(`safeWithdraw:${result}`);
                if(error){
                    console.log(error);
                    alert('Withdraw Failly');
                }
            })
        });
    })
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h4(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({
            className: 'row'
        }));
        row.appendChild(DOM.div({
            className: 'col-sm-4 field'
        }, result.label));
        row.appendChild(DOM.div({
            className: 'col-sm-8 field-value'
        }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function convertDate(myString) {
    if (!myString) return;
    let match = String(myString).match(/^(\d+)-(\d+)-(\d+) (\d+)\:(\d+)\:(\d+)$/);
    let myDate = new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
    return myDate;
}

function searchFlightNumbers(myArray) {
    let newArray = []
    for (var i = 0; i < myArray.length; i++) {
        newArray.push(myArray[i].flight);
    }
    return newArray;
}

function search(nameKey, myArray) {
    for (var i = 0; i < myArray.length; i++) {
        if (myArray[i].flight === nameKey) {
            return myArray[i];
        }
    }
}
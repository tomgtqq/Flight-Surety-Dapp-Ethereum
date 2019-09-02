
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        /***********************************************/
        /*                Administrator                */
        /***********************************************/
        const contractAddress={
                    'ligic_contract': contract.appAddress
                };
        const appAddress = contractAddress['ligic_contract'];
        
        // Select contract address
        DOM.elid("logic-contract-address").appendChild(
            DOM.createOption(
                appAddress.slice(0,8).padEnd(36,'*').concat(appAddress.slice(-6))
               ,'ligic_contract')
        );
       
        // Authorize
        DOM.elid('authorize-contract').addEventListener('click', async() => {
            let e = DOM.elid('logic-contract-address');
            let value =  e.options[e.selectedIndex].value
            await contract.authorizeContract(contractAddress[value]);
            let resutl = await contract.checkAuthorizeContract(contractAddress[value]);
            console.log(`resutl:${resutl}`);
            if(resutl == true){
               alert('Authorized')
            }else{
               alert('Authorized Fail')
            }
        })

        // Set Contract Operational status

        DOM.elid('operationalStatusOpen').addEventListener('click', async() => {
            await contract.setOperatingStatus(true);
        })
        DOM.elid('operationalStatusClose').addEventListener('click', async() => {
            await contract.setOperatingStatus(false);
        })

       

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            // if(result){
            //     DOM.elid('operationalStatusOpen').checked = true;
            // }else{
            //     DOM.elid('operationalStatusClose').checked = true;
            // }
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })
    
    });
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}








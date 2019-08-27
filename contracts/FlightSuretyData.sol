pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Profile {                                                    // Airline property
        string name;                                                    // Airline acronym
        bool isRegistered;
        bool isFunded;
        address airline;
    }
    mapping(address => Profile) airlines;                               // Mapping for storing airline

    // fund to be paid when registering new airline
    uint256 public constant  REGISTRATION_FUND = 10 ether;

    // address[] multiCalls = new address[](0);                            // Multi-party consensus track
    uint public constant MIN = 4;                                   // Operate Multi-party consensus at least four airlines registered
    uint public airlinesAmount = 0;                                          // Total registered airlines




    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor()public
    {
        contractOwner = msg.sender;

        airlines[contractOwner] = Profile({
            name:"OAL",
            isRegistered: true,
            isFunded: false,
            airline: contractOwner
            });
        airlinesAmount++;
    }
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
    * @dev Modifier that requires the airline was registered
    */
    modifier requireAirlineIsRegistered
                            (
                                address _airline
                            )
    {
        require(airlines[_airline].isRegistered, "The airline wasn't registered");
        _;
    }

        /**
    * @dev Modifier that requires the airline invested capital
    */
    modifier requireAirlineIsFunded
                            (
                                address _airline
                            )
    {
        require(airlines[_airline].isFunded, "The airline didn't invested capital");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }
    /**
    * @dev Multi-party consensus , voting
    *
    */
    struct Ballot {
        uint id;
        string name;
        address airline;
        uint vote;
        bool approved;
    }
    mapping(uint => Ballot) ballots;
    uint nextBallotId;

    mapping(address => mapping(uint => bool)) votes;

    function createBallot(
        string  name,
        address airline
        )
        external
        requireAirlineIsRegistered(msg.sender)
        requireAirlineIsFunded(msg.sender)
        {
        ballots[nextBallotId].id = nextBallotId;
        ballots[nextBallotId].name = name;
        ballots[nextBallotId].airline = airline;
        nextBallotId++;
    }

    function vote(uint ballotId)
        external
        requireAirlineIsRegistered(msg.sender)
        requireAirlineIsFunded(msg.sender)
        {
            require(votes[msg.sender][ballotId] == false, 'voter can only vote once for a ballot');
            votes[msg.sender][ballotId] = true;
            ballots[ballotId].vote++;

            if(ballots[ballotId].vote > airlinesAmount/2 || airlinesAmount <= MIN ){
                    ballots[ballotId].approved = true;
                }
         }

    function results(uint ballotId)
        external
        view
        returns(
            string name,
            address airline,
            uint vote,
            bool approved,
            uint amount
            )
            {
                name = ballots[ballotId].name;
                airline = ballots[ballotId].airline;
                vote = ballots[ballotId].vote;
                approved = ballots[ballotId].approved;
                amount = airlinesAmount;
            }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus(bool mode)
        external
        requireContractOwner
    {
        require(mode != operational, "New mode must be different from existing mode");
        operational = mode;
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                string name,
                                address airline,
                                uint ballotId
                            )
                            external
                            requireIsOperational
                            requireAirlineIsRegistered(msg.sender)
                            requireAirlineIsFunded(msg.sender)

    {
        require(!airlines[airline].isRegistered, "Airline is already registered.");
        require(ballots[ballotId].approved,"Ballot wasn't approved");

        airlines[airline] = Profile({
                    name: name,
                    isRegistered: true,
                    isFunded: false,
                    airline: airline
                    });

        airlinesAmount++;
    }


//    /**
//     * @dev Add an airline to the registration queue
//     *      Can only be called from FlightSuretyApp contract
//     *
//     */
//     function registerAirline
//                             (
//                                 string _name,
//                                 address _airline
//                             )
//                             external
//                             requireIsOperational
//                             requireAirlineIsRegistered(msg.sender)
//                             requireAirlineIsFunded(msg.sender)

//     {
//         require(!airlines[_airline].isRegistered, "Airline is already registered.");

//         bool isDuplicate = false;

//         for(uint c=0 ; c<multiCalls.length ; c++){
//             if(multiCalls[c] == msg.sender){
//                 isDuplicate = true;
//                 break;
//             }
//         }

//         require(!isDuplicate,"Caller has already called this function");

//         multiCalls.push(msg.sender);

//         if (quorum_amount <= quorum_min || multiCalls.length > quorum_amount.div(2)) {

//                 airlines[_airline] = Profile({
//                             name:_name,
//                             isRegistered: true,
//                             isFunded: false,
//                             airline: _airline
//                             });

//                 quorum_amount.add(1);

//                 multiCalls = new address[](0);
//         }
//     }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (

                            )
                            public
                            payable
                            requireAirlineIsRegistered(msg.sender)
    {
        require(msg.value >= REGISTRATION_FUND,"Not enough fund to be paid when registering new airline");
        airlines[msg.sender].isFunded = true;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }


    /**
    * @dev For testing
    *      can block access to functions using requireIsOperational when operating status is false
    */
   
    function setTestingMode
                         (
                                bool mode
                            )
                            external
                            requireIsOperational
                            returns(bool)
    {
        bool testMode = mode;
        return testMode;
    }



    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable
    {
        fund();
    }


}


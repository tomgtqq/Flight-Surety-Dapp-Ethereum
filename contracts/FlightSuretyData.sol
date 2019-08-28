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
    mapping(address => Profile) private airlines;                       // Mapping for storing airline

    uint256 private constant  REGISTRATION_FUND = 10 ether;              // fund to be paid when registering new airline
    uint256 private constant  MIN_INSURED_VALUE = 1 ether;

    uint256 private airlinesAmount = 0;                                 // Total registered airlines
    uint256 private constant AUTHORIZED = 1;

    struct Flight {
        string flight;
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    mapping(address => uint256) private authorizedContracts;

    mapping(bytes32 => mapping(address => uint256)) private insurance;

    mapping(address => uint256) deposit;

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
        airlinesAmount.add(1);
    }
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

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
    modifier requireAirlineIsRegistered(address _airline)
    {
        require(airlines[_airline].isRegistered, "The airline wasn't registered");
        _;
    }

    /**
    * @dev Modifier that requires the airline invested capital
    */
    modifier requireAirlineIsFunded(address _airline)
    {
        require(airlines[_airline].isFunded, "The airline didn't invested capital");
        _;
    }

    /**
    * @dev Rate limiting pattern rateLimit(30 minutes)
    */
    uint256 private enabled = block.timestamp;
    modifier rateLimit(uint time){
        require(block.timestamp >= enabled, "Rate limiting in effect");
        enabled = enabled.add(time);
        _;
    }

    /**
    * @dev Re-entrancy Guard
    */
    uint256 private counter = 1;

    modifier entrancyGuard(){
        counter = counter.add(1);
        uint256 guard = counter;
        _;
        require(guard == counter,"That is not allowed");
    }

    /**
    * @dev check if the caller was authorized
    */
    modifier requireIsCallerAuthorized(){
        require(authorizedContracts[msg.sender] == AUTHORIZED, "The callder wasn't authorized");
        _;
    }

   /**
    * @dev check value to refund
    */
    modifier checkValue(uint256 due ){
        _;
        uint256 amountToRefund = msg.value.sub(due);
        msg.sender.transfer(amountToRefund);
    }

    /********************************************************************************************/
    /*                             MANAGMENT AIRLINES AND FLIGHTS                               */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    */
    function addAirline
                            (
                                string calldata name,
                                address airline
                            )
                            external
                            requireIsOperational
                            requireIsCallerAuthorized
    {
        require(!airlines[airline].isRegistered, "Airline is already registered.");

        airlines[airline] = Profile({
                    name: name,
                    isRegistered: true,
                    isFunded: false,
                    airline: airline
                    });

        airlinesAmount.add(1);
    }
   /**
    * @dev Add an airline to the registration queue
    *
    */
    function getAirlineInfo(address airline)
                external
                view
                requireIsOperational
                requireIsCallerAuthorized
                returns(
                        string memory name,
                        bool isRegistered,
                        bool isFunded
                )
    {
        require(airlines[airline].isRegistered, "Airline wasn't registered.");
                    name = airlines[airline].name;
                    isRegistered = airlines[airline].isRegistered;
                    isFunded = airlines[airline].isFunded;
    }
   /**
    * @dev Get airlines amount
    *
    */
    function getAirlinesAmount()
        external
        view
        requireIsOperational
    returns(uint256){
        return airlinesAmount;
    }

   /**
    * @dev Add an airline to the registration queue
    *
    */
    function addFlights
            (
                bytes32 flightKey,
                string calldata flight,
                uint8 statusCode,
                uint256 updatedTimestamp,
                address airline
            )
            external
            requireIsOperational
            requireIsCallerAuthorized
    {
        require(!flights[flightKey].isRegistered, "flights is already registered.");

        flights[flightKey] = Flight({
                    flight: flight,
                    isRegistered: true,
                    statusCode: statusCode,
                    updatedTimestamp: updatedTimestamp,
                    airline: airline
                    });
    }

    /**
    * @dev Add an airline to the registration queue
    *
    */
    function upateFlights
            (
                bytes32 flightKey,
                uint8 statusCode
            )
            external
            requireIsOperational
            requireIsCallerAuthorized
    {
        require(flights[flightKey].isRegistered, "flights wasn't registered.");

        flights[flightKey].statusCode = statusCode;
    }

        /**
    * @dev Add an airline to the registration queue
    *
    */
    function getFlightInfo(bytes32 flightKey)
            external
            view
            requireIsOperational
            requireIsCallerAuthorized
            returns(
                        string memory flight,
                        bool isRegistered,
                        uint8 statusCode,
                        uint256 updatedTimestamp,
                        address airline
                    )
    {
        require(flights[flightKey].isRegistered, "flights wasn't registered.");
            flight = flights[flightKey].flight;
            isRegistered = true;
            statusCode = flights[flightKey].statusCode;
            updatedTimestamp = flights[flightKey].updatedTimestamp;
            airline = flights[flightKey].airline;
    }

    /********************************************************************************************/
    /*                                     MANAGMENT CONTRACT                                   */
    /********************************************************************************************/

    /**
    * @dev Sets contract operations on/off
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
    * @dev Get operating status of contract
    * @return A bool that is the current operating status
    */
    function isOperational() public view returns(bool)
    {
        return operational;
    }

    /**
    * @dev Check if the airline was registered
    */
    function isAirlineRegistered(address _airline)
        public
        view
        requireIsOperational
        returns(bool)
        {
            return airlines[_airline].isRegistered;
        }

    /**
    * @dev Check if the airline invested capital
    */
    function isAirlineFunded(address _airline)
        public
        view
        requireIsOperational
        returns(bool)
    {
        return airlines[_airline].isFunded;
    }

    /**
    * @dev authorize contract
    */
    function authorizeContract( address contractAddress)
            external
            requireContractOwner
            {
                authorizedContracts[contractAddress] =  AUTHORIZED;
            }

    /**
    * @dev deauthorize contract
    */
    function deauthorizeContract( address contractAddress)
            external
            requireContractOwner
            {
                delete authorizedContracts[contractAddress];
            }
            
    /********************************************************************************************/
    /*                                   CONTRACT FUNCTION                                      */
    /********************************************************************************************/

    /**
    * @dev get contract balance
    */
    function balanceOf()
        public
        view
        returns(uint)
        {
            return address(this).balance;
        }

    /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */

    function fund()
        public
        payable
        requireIsOperational
        requireAirlineIsRegistered(msg.sender)
        checkValue(REGISTRATION_FUND)
    {
        require(msg.value >= REGISTRATION_FUND,"Not enough fund to be paid when registering new airline");
        airlines[msg.sender].isFunded = true;
    }

    /**
    * @dev Buy insurance for a flight
    */
    function buyInsurance
            (
                bytes32 flightKey,
                uint256 insuredValue
            )
            external
            payable
            requireIsOperational
    {
        require(msg.value >= MIN_INSURED_VALUE,"Minimum insurance is 1 ether");
        insurance[flightKey][msg.sender] = insuredValue;
    }

    /**
    * @dev Check insurance for a flight
    */
    function checkInsurance
            (
                bytes32 flightKey,
                address applicant
            )
            external
            view
            requireIsOperational
            returns(uint256)
    {
        return insurance[flightKey][applicant];
    }


    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
            (
                uint256 amount,
                address applicant
            )
            external
            requireIsOperational
            requireIsCallerAuthorized
    {
        deposit[applicant] = amount;
    }

    /**
    * @dev safe withdraw
    */
    function safeWithdraw(uint256 amount)
                external
                requireIsOperational
                rateLimit(30 minutes)
                entrancyGuard
    {
        // Checks
        require(msg.sender == tx.origin, "Contracts not allowed");
        require(deposit[msg.sender] >= amount,"insufficient funds");

        // Effects
        deposit[msg.sender] = deposit[msg.sender].sub(amount);

        // Interaction
        msg.sender.transfer(amount);
    }

    /********************************************************************************************/
    /*                                     FOR TESTING                                          */
    /********************************************************************************************/

    /**
    * @dev For testing
    * can block access to functions using requireIsOperational when operating status is false
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

    /********************************************************************************************/
    /*                                    FALLBACK FUNCTION                                     */
    /********************************************************************************************/

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() external payable
    {
        fund();
    }

}


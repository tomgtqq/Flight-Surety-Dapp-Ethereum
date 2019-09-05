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

    uint256 public constant  REGISTRATION_FUND = 10 ether;              // fund to be paid when registering new airline
    uint256 public constant  MIN_INSURED_VALUE = 1 ether;

    uint256 private airlinesAmount = 0;                                 // Total registered airlines
    uint256 private constant AUTHORIZED = 1;

    mapping(address => uint256) private authorizedContracts;

    mapping(bytes32 => mapping(address => uint256)) private insurance;

    mapping(address => uint256) private deposit;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor(address firstAirline)public
    {
        contractOwner = msg.sender;

        airlines[firstAirline] = Profile({
            name:"Sas",
            isRegistered: true,
            isFunded: false,
            airline: firstAirline
            });
        airlinesAmount++;
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
        require(airlines[_airline].isRegistered, "FlightSuretyData The airline wasn't registered");
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
        uint256 a = enabled;
        uint256 b = time;
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        enabled = c;

        _;
    }

    /**
    * @dev Re-entrancy Guard
    */
    uint256 private counter = 1;

    modifier entrancyGuard(){
        counter = counter+1;
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
    /*                             MANAGMENT AIRLINES                                           */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *
    */
    function addAirline
                            (
                                string  name,
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

        airlinesAmount++;
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
    /**
    * @dev check authorize contract
    */
    function checkAuthorizeContract( address contractAddress)
            external
            view
            requireContractOwner
            returns(uint256)
            {
                return authorizedContracts[contractAddress];
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
        returns(uint256)
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
                address airline,
                string  flight,
                uint256 timestamp
            )
            external
            payable
            requireIsOperational
    {
        require(msg.sender == tx.origin, "Contracts not allowed");
        require(msg.value >= MIN_INSURED_VALUE,"Minimum insurance is 1 ether");
        require(timestamp> now,"Only purchase not boarding flights");  //block.timestamp

        bytes32 flightKey = getFlightKey(airline,flight,timestamp);

        uint256 a = insurance[flightKey][msg.sender];
        uint256 b = msg.value;
        uint256 c = a + b;

        require(c >= a, "SafeMath: addition overflow");
        insurance[flightKey][msg.sender] = c;
    }

    /**
    * @dev Check insurance for a flight
    */
    function checkInsurance
            (
                bytes32 flightKey,
                address application
            )
            external
            view
            requireIsOperational
            returns(uint256)
    {
        return insurance[flightKey][application];
    }


    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(
            bytes32 flightKey,
            uint256 amount,
            address application
            )
            external
            requireIsOperational
            requireIsCallerAuthorized
    {
        //Effects
        insurance[flightKey][application] = 0;

        //Interaction
        uint256 a = deposit[application];
        uint256 b = amount;
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        deposit[application] = c;
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function checkDeposit()
            external
            view
            returns(uint256)
    {
        return deposit[msg.sender];
    }

    /**
    * @dev safe withdraw
    */
    function safeWithdraw(uint256 amount)
                external
                requireIsOperational
                //rateLimit(30 minutes)
                entrancyGuard
    {
        // Checks
        require(msg.sender == tx.origin, "Contracts not allowed");
        require(deposit[msg.sender] >= amount,"insufficient funds");

        // Effects
        uint256 a = deposit[msg.sender];
        uint256 b = amount;

        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;
        deposit[msg.sender] = c;

        // Interaction
        msg.sender.transfer(amount);
    }

    /**
    * @dev get contract address
    *
    * @return address
    */
    function getContractAddress() external view returns(address)
    {
        return address(this);
    }

        /**
    * @dev get FlightKey
    *
    * @return bytes32 flightKey
    */
    function getFlightKey
                        (
                            address airline,
                            string  flight,
                            uint256 timestamp
                        )
                        internal
                        view
                        requireIsOperational
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
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
                            view
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
        //fund();
    }

}

pragma solidity ^0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    FlightSuretyData flightSuretyData;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract
    address private dataContractAddress;
    bool private operational = true;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    */
    constructor( address dataContract ) public
    {
        contractOwner = msg.sender;
        dataContractAddress = dataContract;
        flightSuretyData = FlightSuretyData(dataContractAddress);
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
    modifier requireAirlineIsRegistered(address _airline)
    {
        require(flightSuretyData.isAirlineRegistered(_airline), "The airline wasn't registered");
        _;
    }

        /**
    * @dev Modifier that requires the airline invested capital
    */
    modifier requireAirlineIsFunded(address _airline)
    {
        require(flightSuretyData.isAirlineFunded(_airline), "The airline didn't invested capital");
        _;
    }

    /********************************************************************************************/
    /*                       MULTI-PARTY CONSENSUS TO REGISTER NEW AIRLINES                     */
    /********************************************************************************************/

    struct Ballot {
        uint id;
        string name;
        address airline;
        uint256 vote;
        bool approved;
    }
    mapping(uint => Ballot) ballots;
    uint256 public nextBallotId = 1;

    mapping(address => mapping(uint => bool)) votes;

   /**
    * @dev create ballot for adding an airline to the registration queue
    *
    */
    function createBallot(
        string name,
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

    function getNextBallotId() external view returns(uint256){
      return nextBallotId;
    }
   /**
    * @dev vote for adding an airline to the registration queue
    *
    */
    function vote(uint ballotId)
        external
        requireAirlineIsRegistered(msg.sender)
        requireAirlineIsFunded(msg.sender)
        {
            require(votes[msg.sender][ballotId] == false, 'voter can only vote once for a ballot');
            votes[msg.sender][ballotId] = true;
            ballots[ballotId].vote++;

            uint256 airlinesAmount = flightSuretyData.getAirlinesAmount();
            uint256 quorum = airlinesAmount/2;

            if(ballots[ballotId].vote > quorum){
                 ballots[ballotId].approved = true;
            }
         }

    function getVoteInfo(uint ballotId) 
            external 
            view
            returns(uint256 voteNum ,uint256 quorum,uint256 airlinesAmount)
    {
        voteNum = ballots[ballotId].vote;
        airlinesAmount = flightSuretyData.getAirlinesAmount();
        quorum = airlinesAmount/2;
    }

    /********************************************************************************************/
    /*                             MANAGMENT AIRLINES AND FLIGHTS                               */
    /********************************************************************************************/

    /**
    * @dev Add an airline to the registration queue
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
        uint256 airlinesAmount = flightSuretyData.getAirlinesAmount();

        require((ballots[ballotId].approved || airlinesAmount <= 4),"Ballot wasn't approved");
        flightSuretyData.addAirline(name,airline);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address airline,
                                    string  flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
    {
        bytes32 flightKey = getFlightKey(airline,flight,timestamp);

        flights[flightKey] = Flight({
                                isRegistered: true,
                                statusCode: statusCode,
                                updatedTimestamp:timestamp,
                                airline:airline
                              });
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
                        requireIsOperational
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
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
    * @dev credit Insurees
    *
    */
    function appCreditInsurees(
                    address airline,
                    string  flight,
                    uint256 timestamp
                )
                external
                requireIsOperational
    {

        bytes32 flightKey = getFlightKey(airline,flight,timestamp);

        require(flights[flightKey].isRegistered,"Flight status not updated");
        require(flights[flightKey].statusCode == STATUS_CODE_LATE_AIRLINE,"There isn't the flight that need to pay for air delay insurance");

        uint256 purchase = flightSuretyData.checkInsurance(flightKey,msg.sender);
        require(purchase > 0,"Didn't buy insurance");

        flightSuretyData.creditInsurees(flightKey,
                calculateCompensation(purchase),
                msg.sender);
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
                        public
                        view
                        requireIsOperational
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev calculate compensation
    *
    * @return amount of compensation
    */
    function calculateCompensation(uint256 purchase)
        internal
        pure
        returns(uint256)
    {
        uint256 c = purchase * 15;
        require((c/purchase) == 15, "SafeMath: multiplication overflow");
        return c/10;
       // return (purchase.mul(15).div(10));
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

    /********************************************************************************************/
    /*                                   ORACLE MANAGEMENT                            */
    /********************************************************************************************/


    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
                            requireIsOperational
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
        dataContractAddress.transfer(msg.value);
    }

    function getMyIndexes( )
                    external
                    view
                    requireIsOperational
                    returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
                        requireIsOperational
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
           processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
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
}
/********************************************************************************************/
/*                                  FlightSuretyData contract                               */
/********************************************************************************************/
contract FlightSuretyData{
    function isAirlineRegistered(address _airline) public view returns(bool);
    function isAirlineFunded(address _airline) public view returns(bool);
    function getAirlinesAmount() public view returns(uint256);
    function addAirline(string name,address airline) external;
    function creditInsurees(bytes32 flightKey,uint256 amount, address application) external;
    function checkInsurance(bytes32 flightKey, address application) external view returns(uint256);
}


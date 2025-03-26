// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/* --------------------------------------------------------------------------
   Minimal Ownable Implementation
-------------------------------------------------------------------------- */
contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/* --------------------------------------------------------------------------
   Minimal ReentrancyGuard Implementation
-------------------------------------------------------------------------- */
contract ReentrancyGuard {
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/* --------------------------------------------------------------------------
   BuyMeACoffee Contract
-------------------------------------------------------------------------- */
contract BuyMeACoffee is Ownable, ReentrancyGuard {
    // Event emitted when a new memo is recorded (now includes `amount`)
    event NewMemo(
        string name,
        string message,
        uint256 timestamp,
        address indexed from,
        uint256 amount
    );

    // Event emitted when the minimum coffee price is updated
    event MinCoffeePriceUpdated(uint256 newPrice);

    // Structure to store memo details for each donation (or coffee purchase)
    struct Memo {
        string name;
        string message;
        uint256 timestamp;
        address from;
        uint256 amount; // Donation amount in wei
    }

    // Array to store all memos received from supporters
    Memo[] private memos;

    // Minimum donation (coffee) price required (default set to 0.001 Ether)
    uint256 public minCoffeePrice = 0.001 ether;

    // Total amount donated via the contract (for record-keeping)
    uint256 public totalDonations;

    /**
     * @notice Constructor: Initializes the Ownable contract with `msg.sender`.
     *         ReentrancyGuard is automatically initialized.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Donate (buy a coffee) and leave a memo for the owner.
     * @param _name The name of the supporter.
     * @param _message A message for the owner.
     *
     * Requirements:
     * - The donation amount must be at least the minimum coffee price.
     * - The function is protected against reentrancy.
     *
     * Note: The donated ETH is immediately forwarded to the owner, so the contract
     *       does not hold the funds. However, the donation is recorded in memos along with its amount.
     */
    function buyCoffee(string calldata _name, string calldata _message)
        external
        payable
        nonReentrant
    {
        require(
            msg.value >= minCoffeePrice,
            "Donation amount is less than the minimum required"
        );

        // Record the donation by storing a memo (including the `amount`)
        memos.push(
            Memo({
                name: _name,
                message: _message,
                timestamp: block.timestamp,
                from: msg.sender,
                amount: msg.value
            })
        );

        // Update total donations (using unchecked for slight gas savings)
        unchecked {
            totalDonations += msg.value;
        }

        // Forward the donation immediately to the owner
        address _owner = owner();
        (bool sent, ) = _owner.call{value: msg.value}("");
        require(sent, "Failed to send Ether to the owner");

        // Emit event with the memo details (including `amount`)
        emit NewMemo(_name, _message, block.timestamp, msg.sender, msg.value);
    }

    /**
     * @notice Allows the owner to update the minimum donation (coffee) price.
     * @param _newPrice The new minimum price (in wei) required to buy a coffee.
     */
    function updateMinCoffeePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Minimum price must be greater than zero");
        minCoffeePrice = _newPrice;
        emit MinCoffeePriceUpdated(_newPrice);
    }

    /**
     * @notice Retrieve all memos stored in the contract.
     * @return An array of Memo structs.
     */
    function getMemos() external view returns (Memo[] memory) {
        return memos;
    }

    /**
     * @notice Returns the total amount donated (in wei).
     * @return The total donations.
     */
    function getTotalDonations() external view returns (uint256) {
        return totalDonations;
    }

    /**
     * @notice Fallback function to accept ETH sent directly to the contract.
     *         Automatically forwards the funds to the owner.
     */
    receive() external payable {
        address _owner = owner();
        (bool sent, ) = _owner.call{value: msg.value}("");
        require(sent, "Failed to forward Ether");
    }

    /**
     * @notice Fallback function for calls with data.
     *         Automatically forwards the funds to the owner.
     */
    fallback() external payable {
        address _owner = owner();
        (bool sent, ) = _owner.call{value: msg.value}("");
        require(sent, "Failed to forward Ether");
    }
}

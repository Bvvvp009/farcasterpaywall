// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaidAccess {
    mapping(address => bool) public hasPaid;

    function pay() external payable {
        require(msg.value >= 0.02 ether, "Minimum is 0.02 ETH");
        hasPaid[msg.sender] = true;
    }

    function checkAccess(address user) external view returns (bool) {
        return hasPaid[user];
    }
}

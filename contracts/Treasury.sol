// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Governor.sol";

/**
 * @title Treasury
 * @dev Treasury contract for DAO with multisig execution capability
 */
contract Treasury is Ownable {
    Governor public governor;
    address public multisig;

    event FundsReceived(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event MultisigUpdated(address indexed oldMultisig, address indexed newMultisig);
    event ProposalExecuted(uint256 indexed proposalId, address indexed executor);

    modifier onlyMultisig() {
        require(msg.sender == multisig, "Only multisig can call");
        _;
    }

    constructor(address _governor, address _multisig) Ownable(msg.sender) {
        require(_governor != address(0), "Invalid governor address");
        require(_multisig != address(0), "Invalid multisig address");

        governor = Governor(_governor);
        multisig = _multisig;
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    /**
     * @dev Execute a successful proposal (only multisig)
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external onlyMultisig {
        (
            ,
            ,
            ,
            ,
            ,
            ,
            Governor.ProposalState state
        ) = governor.getProposal(proposalId);

        require(state == Governor.ProposalState.Succeeded, "Proposal not succeeded");

        emit ProposalExecuted(proposalId, msg.sender);
    }

    /**
     * @dev Withdraw funds from treasury (only multisig)
     * @param to Address to send funds to
     * @param amount Amount to withdraw
     */
    function withdraw(address payable to, uint256 amount) external onlyMultisig {
        require(to != address(0), "Invalid address");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(to, amount);
    }

    /**
     * @dev Update multisig address (only owner)
     * @param _multisig New multisig address
     */
    function updateMultisig(address _multisig) external onlyOwner {
        require(_multisig != address(0), "Invalid multisig address");

        address oldMultisig = multisig;
        multisig = _multisig;

        emit MultisigUpdated(oldMultisig, _multisig);
    }

    /**
     * @dev Get treasury balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;

describe("DAO System", function () {
  let token, governor, treasury;
  let owner, addr1, addr2, multisig;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const VOTING_PERIOD = 3 * 24 * 60 * 60; // 3 days

  beforeEach(async function () {
    [owner, addr1, addr2, multisig] = await ethers.getSigners();

    // Deploy Token
    const Token = await ethers.getContractFactory("DAOToken");
    token = await Token.deploy("DAO Token", "DAO", INITIAL_SUPPLY);

    // Deploy Governor
    const Governor = await ethers.getContractFactory("Governor");
    governor = await Governor.deploy(await token.getAddress());

    // Deploy Treasury
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(
      await governor.getAddress(),
      multisig.address
    );

    // Distribute tokens for testing
    await token.transfer(addr1.address, ethers.parseEther("100000"));
    await token.transfer(addr2.address, ethers.parseEther("50000"));
  });

  describe("DAOToken", function () {
    it("Should deploy with correct initial supply", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await token.mint(addr1.address, mintAmount);

      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("101000"));
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.reverted;
    });

    it("Should transfer tokens correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      await token.connect(addr1).transfer(addr2.address, transferAmount);

      const addr1Balance = await token.balanceOf(addr1.address);
      const addr2Balance = await token.balanceOf(addr2.address);

      expect(addr1Balance).to.equal(ethers.parseEther("99000"));
      expect(addr2Balance).to.equal(ethers.parseEther("51000"));
    });
  });

  describe("Governor", function () {
    describe("Proposal Creation", function () {
      it("Should create a proposal successfully", async function () {
        const description = "Test Proposal";
        const tx = await governor.createProposal(description);
        const receipt = await tx.wait();

        const proposalId = 1;
        const proposal = await governor.getProposal(proposalId);

        expect(proposal.id).to.equal(proposalId);
        expect(proposal.description).to.equal(description);
        expect(proposal.state).to.equal(0); // Active
      });

      it("Should emit ProposalCreated event", async function () {
        const description = "Test Proposal";
        await expect(governor.createProposal(description))
          .to.emit(governor, "ProposalCreated")
          .withArgs(1, description, await time.latest() + 1, await time.latest() + 1 + VOTING_PERIOD);
      });

      it("Should not allow empty description", async function () {
        await expect(governor.createProposal("")).to.be.revertedWith(
          "Description cannot be empty"
        );
      });

      it("Should increment proposal count", async function () {
        await governor.createProposal("Proposal 1");
        await governor.createProposal("Proposal 2");

        const count = await governor.proposalCount();
        expect(count).to.equal(2);
      });
    });

    describe("Voting", function () {
      let proposalId;

      beforeEach(async function () {
        const tx = await governor.createProposal("Test Proposal");
        await tx.wait();
        proposalId = 1;
      });

      it("Should allow token holder to vote", async function () {
        await governor.connect(addr1).vote(proposalId, true);

        const proposal = await governor.getProposal(proposalId);
        expect(proposal.forVotes).to.equal(ethers.parseEther("100000"));
      });

      it("Should emit Voted event", async function () {
        const weight = await token.balanceOf(addr1.address);

        await expect(governor.connect(addr1).vote(proposalId, true))
          .to.emit(governor, "Voted")
          .withArgs(proposalId, addr1.address, true, weight);
      });

      it("Should record votes against", async function () {
        await governor.connect(addr2).vote(proposalId, false);

        const proposal = await governor.getProposal(proposalId);
        expect(proposal.againstVotes).to.equal(ethers.parseEther("50000"));
      });

      it("Should not allow voting twice", async function () {
        await governor.connect(addr1).vote(proposalId, true);

        await expect(
          governor.connect(addr1).vote(proposalId, true)
        ).to.be.revertedWith("Already voted");
      });

      it("Should not allow voting without tokens", async function () {
        const noTokensAddr = (await ethers.getSigners())[3];

        await expect(
          governor.connect(noTokensAddr).vote(proposalId, true)
        ).to.be.revertedWith("No voting power");
      });

      it("Should not allow voting after period ends", async function () {
        await time.increase(VOTING_PERIOD + 1);

        await expect(
          governor.connect(addr1).vote(proposalId, true)
        ).to.be.revertedWith("Voting has ended");
      });

      it("Should track multiple voters correctly", async function () {
        await governor.connect(addr1).vote(proposalId, true);
        await governor.connect(addr2).vote(proposalId, false);

        const proposal = await governor.getProposal(proposalId);
        expect(proposal.forVotes).to.equal(ethers.parseEther("100000"));
        expect(proposal.againstVotes).to.equal(ethers.parseEther("50000"));
      });
    });

    describe("Proposal Execution", function () {
      let proposalId;

      beforeEach(async function () {
        const tx = await governor.createProposal("Test Proposal");
        await tx.wait();
        proposalId = 1;
      });

      it("Should execute proposal after voting period", async function () {
        await governor.connect(addr1).vote(proposalId, true);
        await time.increase(VOTING_PERIOD + 1);

        await governor.executeProposal(proposalId);

        const proposal = await governor.getProposal(proposalId);
        expect(proposal.state).to.equal(1); // Succeeded
      });

      it("Should mark proposal as defeated if more votes against", async function () {
        await governor.connect(addr1).vote(proposalId, false);
        await time.increase(VOTING_PERIOD + 1);

        await governor.executeProposal(proposalId);

        const proposal = await governor.getProposal(proposalId);
        expect(proposal.state).to.equal(2); // Defeated
      });

      it("Should not execute before voting period ends", async function () {
        await expect(
          governor.executeProposal(proposalId)
        ).to.be.revertedWith("Voting period not ended");
      });

      it("Should emit ProposalExecuted event", async function () {
        await governor.connect(addr1).vote(proposalId, true);
        await time.increase(VOTING_PERIOD + 1);

        await expect(governor.executeProposal(proposalId))
          .to.emit(governor, "ProposalExecuted")
          .withArgs(proposalId);
      });
    });

    describe("Helper Functions", function () {
      it("Should check if address has voted", async function () {
        const tx = await governor.createProposal("Test Proposal");
        await tx.wait();
        const proposalId = 1;

        expect(await governor.hasVoted(proposalId, addr1.address)).to.be.false;

        await governor.connect(addr1).vote(proposalId, true);

        expect(await governor.hasVoted(proposalId, addr1.address)).to.be.true;
      });

      it("Should allow owner to change voting period", async function () {
        const newPeriod = 7 * 24 * 60 * 60; // 7 days
        await governor.setVotingPeriod(newPeriod);

        expect(await governor.votingPeriod()).to.equal(newPeriod);
      });
    });
  });

  describe("Treasury", function () {
    it("Should receive ETH", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: amount,
      });

      expect(await treasury.getBalance()).to.equal(amount);
    });

    it("Should emit FundsReceived event", async function () {
      const amount = ethers.parseEther("1");

      await expect(
        owner.sendTransaction({
          to: await treasury.getAddress(),
          value: amount,
        })
      )
        .to.emit(treasury, "FundsReceived")
        .withArgs(owner.address, amount);
    });

    it("Should allow multisig to withdraw funds", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: amount,
      });

      const initialBalance = await ethers.provider.getBalance(addr1.address);

      await treasury.connect(multisig).withdraw(addr1.address, amount);

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should not allow non-multisig to withdraw", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: amount,
      });

      await expect(
        treasury.connect(addr1).withdraw(addr2.address, amount)
      ).to.be.revertedWith("Only multisig can call");
    });

    it("Should allow owner to update multisig address", async function () {
      await treasury.updateMultisig(addr1.address);

      expect(await treasury.multisig()).to.equal(addr1.address);
    });

    it("Should emit MultisigUpdated event", async function () {
      await expect(treasury.updateMultisig(addr1.address))
        .to.emit(treasury, "MultisigUpdated")
        .withArgs(multisig.address, addr1.address);
    });

    it("Should allow multisig to execute succeeded proposals", async function () {
      // Create and vote on proposal
      const tx = await governor.createProposal("Treasury Proposal");
      await tx.wait();
      const proposalId = 1;

      await governor.connect(addr1).vote(proposalId, true);
      await time.increase(VOTING_PERIOD + 1);
      await governor.executeProposal(proposalId);

      // Execute via treasury
      await expect(treasury.connect(multisig).executeProposal(proposalId))
        .to.emit(treasury, "ProposalExecuted")
        .withArgs(proposalId, multisig.address);
    });

    it("Should not execute non-succeeded proposals", async function () {
      // Create and vote against proposal
      const tx = await governor.createProposal("Treasury Proposal");
      await tx.wait();
      const proposalId = 1;

      await governor.connect(addr1).vote(proposalId, false);
      await time.increase(VOTING_PERIOD + 1);
      await governor.executeProposal(proposalId);

      // Try to execute via treasury
      await expect(
        treasury.connect(multisig).executeProposal(proposalId)
      ).to.be.revertedWith("Proposal not succeeded");
    });
  });

  describe("Integration", function () {
    it("Should complete full DAO workflow", async function () {
      // 1. Create proposal
      const description = "Allocate 1 ETH to development";
      const tx = await governor.createProposal(description);
      await tx.wait();
      const proposalId = 1;

      // 2. Vote on proposal
      await governor.connect(addr1).vote(proposalId, true);
      await governor.connect(addr2).vote(proposalId, true);

      // 3. Wait for voting period
      await time.increase(VOTING_PERIOD + 1);

      // 4. Execute proposal in governor
      await governor.executeProposal(proposalId);

      const proposal = await governor.getProposal(proposalId);
      expect(proposal.state).to.equal(1); // Succeeded

      // 5. Fund treasury
      await owner.sendTransaction({
        to: await treasury.getAddress(),
        value: ethers.parseEther("5"),
      });

      // 6. Execute via treasury multisig
      await treasury.connect(multisig).executeProposal(proposalId);

      // 7. Withdraw funds
      const withdrawAmount = ethers.parseEther("1");
      await treasury.connect(multisig).withdraw(addr1.address, withdrawAmount);

      expect(await treasury.getBalance()).to.equal(ethers.parseEther("4"));
    });
  });
});

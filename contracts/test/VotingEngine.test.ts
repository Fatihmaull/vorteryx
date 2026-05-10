import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("VotingEngine", function () {
  async function deployFixture() {
    const [owner, voter1, voter2, voter3] = await ethers.getSigners();
    const IM = await ethers.getContractFactory("IdentityManager");
    const im = await IM.deploy(owner.address);
    const VE = await ethers.getContractFactory("VotingEngine");
    const ve = await VE.deploy(await im.getAddress(), owner.address);
    return { im, ve, owner, voter1, voter2, voter3 };
  }

  async function readyFixture() {
    const { im, ve, owner, voter1, voter2, voter3 } = await loadFixture(deployFixture);
    // Register and verify voters
    await im.connect(voter1).registerIdentity("Budi", 1234567890123456n, "Jakarta");
    await im.connect(voter2).registerIdentity("Siti", 6543210987654321n, "Jakarta");
    await im.connect(voter3).registerIdentity("Andi", 1111222233334444n, "Jawa Barat");
    await im.connect(owner).batchVerifyUsers([voter1.address, voter2.address, voter3.address]);
    // Add candidates
    await ve.connect(owner).addCandidate("Candidate A", "Jakarta");
    await ve.connect(owner).addCandidate("Candidate B", "Jakarta");
    await ve.connect(owner).addCandidate("Candidate C", "Jawa Barat");
    // Create election
    await ve.connect(owner).createElection("Pemilihan Gubernur Jakarta", "Jakarta", [1, 2]);
    await ve.connect(owner).createElection("Pemilihan Gubernur Jabar", "Jawa Barat", [3]);
    return { im, ve, owner, voter1, voter2, voter3 };
  }

  async function activeElectionFixture() {
    const { im, ve, owner, voter1, voter2, voter3 } = await loadFixture(readyFixture);
    await ve.connect(owner).startElection(1);
    await ve.connect(owner).startElection(2);
    return { im, ve, owner, voter1, voter2, voter3 };
  }

  describe("Deployment", function () {
    it("should set identity manager", async function () {
      const { im, ve } = await loadFixture(deployFixture);
      expect(await ve.identityManager()).to.equal(await im.getAddress());
    });
    it("should set owner", async function () {
      const { ve, owner } = await loadFixture(deployFixture);
      expect(await ve.owner()).to.equal(owner.address);
    });
  });

  describe("Candidate Management", function () {
    it("should add candidate", async function () {
      const { ve, owner } = await loadFixture(deployFixture);
      await expect(ve.connect(owner).addCandidate("Alice", "Jakarta"))
        .to.emit(ve, "CandidateAdded").withArgs(1, "Alice", "Jakarta");
      const c = await ve.getCandidate(1);
      expect(c.name).to.equal("Alice");
      expect(c.region).to.equal("Jakarta");
      expect(c.voteCount).to.equal(0);
    });
    it("should reject empty name", async function () {
      const { ve, owner } = await loadFixture(deployFixture);
      await expect(ve.connect(owner).addCandidate("", "Jakarta"))
        .to.be.revertedWithCustomError(ve, "InvalidCandidateName");
    });
    it("should reject non-admin", async function () {
      const { ve, voter1 } = await loadFixture(deployFixture);
      await expect(ve.connect(voter1).addCandidate("X", "Y"))
        .to.be.revertedWithCustomError(ve, "OwnableUnauthorizedAccount");
    });
  });

  describe("Election Management", function () {
    it("should create election", async function () {
      const { ve, owner } = await loadFixture(readyFixture);
      expect(await ve.electionCount()).to.equal(2);
    });
    it("should reject mismatched candidate region", async function () {
      const { ve, owner } = await loadFixture(readyFixture);
      await expect(ve.connect(owner).createElection("Test", "Jakarta", [3]))
        .to.be.revertedWithCustomError(ve, "CandidateRegionMismatch");
    });
    it("should start and end election", async function () {
      const { ve, owner } = await loadFixture(readyFixture);
      await expect(ve.connect(owner).startElection(1))
        .to.emit(ve, "ElectionStarted");
      await expect(ve.connect(owner).endElection(1))
        .to.emit(ve, "ElectionEnded");
    });
    it("should prevent starting already active", async function () {
      const { ve, owner } = await loadFixture(activeElectionFixture);
      await expect(ve.connect(owner).startElection(1))
        .to.be.revertedWithCustomError(ve, "ElectionNotPending");
    });
  });

  describe("Voting", function () {
    it("should allow verified voter with matching region", async function () {
      const { ve, voter1 } = await loadFixture(activeElectionFixture);
      await expect(ve.connect(voter1).vote(1, 1))
        .to.emit(ve, "VoteCast").withArgs(1, 1, voter1.address);
    });
    it("should increment vote count", async function () {
      const { ve, voter1, voter2 } = await loadFixture(activeElectionFixture);
      await ve.connect(voter1).vote(1, 1);
      await ve.connect(voter2).vote(1, 2);
      const c1 = await ve.getCandidate(1);
      const c2 = await ve.getCandidate(2);
      expect(c1.voteCount).to.equal(1);
      expect(c2.voteCount).to.equal(1);
    });
    it("should prevent double voting", async function () {
      const { ve, voter1 } = await loadFixture(activeElectionFixture);
      await ve.connect(voter1).vote(1, 1);
      await expect(ve.connect(voter1).vote(1, 2))
        .to.be.revertedWithCustomError(ve, "AlreadyVoted");
    });
    it("should prevent voting with wrong region", async function () {
      const { ve, voter3 } = await loadFixture(activeElectionFixture);
      // voter3 is from Jawa Barat, election 1 is Jakarta
      await expect(ve.connect(voter3).vote(1, 1))
        .to.be.revertedWithCustomError(ve, "UnauthorizedRegion");
    });
    it("should allow voter3 to vote in Jawa Barat election", async function () {
      const { ve, voter3 } = await loadFixture(activeElectionFixture);
      await expect(ve.connect(voter3).vote(2, 3)).to.emit(ve, "VoteCast");
    });
    it("should prevent voting on ended election", async function () {
      const { ve, owner, voter1 } = await loadFixture(activeElectionFixture);
      await ve.connect(owner).endElection(1);
      await expect(ve.connect(voter1).vote(1, 1))
        .to.be.revertedWithCustomError(ve, "ElectionNotActive");
    });
    it("should prevent invalid candidate for election", async function () {
      const { ve, voter1 } = await loadFixture(activeElectionFixture);
      // candidate 3 is not in election 1's candidate list
      await expect(ve.connect(voter1).vote(1, 3))
        .to.be.revertedWithCustomError(ve, "InvalidCandidate");
    });
  });

  describe("Results", function () {
    it("should return election results", async function () {
      const { ve, voter1, voter2 } = await loadFixture(activeElectionFixture);
      await ve.connect(voter1).vote(1, 1);
      await ve.connect(voter2).vote(1, 1);
      const [title, region, status, totalVotes, candidates] = await ve.getElectionResults(1);
      expect(title).to.equal("Pemilihan Gubernur Jakarta");
      expect(totalVotes).to.equal(2);
      expect(candidates[0].voteCount).to.equal(2);
    });
    it("should return all elections", async function () {
      const { ve } = await loadFixture(readyFixture);
      const elections = await ve.getAllElections();
      expect(elections.length).to.equal(2);
    });
    it("should return all candidates", async function () {
      const { ve } = await loadFixture(readyFixture);
      const candidates = await ve.getAllCandidates();
      expect(candidates.length).to.equal(3);
    });
  });
});

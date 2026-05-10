import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("IdentityManager", function () {
  async function deployFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    const IM = await ethers.getContractFactory("IdentityManager");
    const im = await IM.deploy(owner.address);
    return { im, owner, user1, user2, user3 };
  }

  async function registeredFixture() {
    const { im, owner, user1, user2, user3 } = await loadFixture(deployFixture);
    await im.connect(user1).registerIdentity("Budi Santoso", 1234567890123456n, "Jakarta");
    await im.connect(user2).registerIdentity("Siti Rahayu", 6543210987654321n, "Jawa Barat");
    return { im, owner, user1, user2, user3 };
  }

  async function verifiedFixture() {
    const { im, owner, user1, user2, user3 } = await loadFixture(registeredFixture);
    await im.connect(owner).verifyUser(user1.address);
    return { im, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("should set the correct owner", async function () {
      const { im, owner } = await loadFixture(deployFixture);
      expect(await im.owner()).to.equal(owner.address);
    });
    it("should start with zero users", async function () {
      const { im } = await loadFixture(deployFixture);
      expect(await im.totalRegistered()).to.equal(0);
    });
  });

  describe("Registration", function () {
    it("should register identity and emit event", async function () {
      const { im, user1 } = await loadFixture(deployFixture);
      await expect(im.connect(user1).registerIdentity("Budi", 1234567890123456n, "Jakarta"))
        .to.emit(im, "IdentityRegistered").withArgs(user1.address, 1234567890123456n, "Budi", "Jakarta");
      expect(await im.totalRegistered()).to.equal(1);
    });
    it("should store data correctly", async function () {
      const { im, user1 } = await loadFixture(registeredFixture);
      const [nama, nik, dom, verified] = await im.getIdentity(user1.address);
      expect(nama).to.equal("Budi Santoso");
      expect(nik).to.equal(1234567890123456n);
      expect(dom).to.equal("Jakarta");
      expect(verified).to.be.false;
    });
    it("should prevent duplicate registration", async function () {
      const { im, user1 } = await loadFixture(registeredFixture);
      await expect(im.connect(user1).registerIdentity("X", 9876543210123456n, "Bali"))
        .to.be.revertedWithCustomError(im, "AlreadyRegistered");
    });
    it("should prevent duplicate NIK", async function () {
      const { im, user3 } = await loadFixture(registeredFixture);
      await expect(im.connect(user3).registerIdentity("X", 1234567890123456n, "Bali"))
        .to.be.revertedWithCustomError(im, "NIKAlreadyUsed");
    });
    it("should reject empty name", async function () {
      const { im, user1 } = await loadFixture(deployFixture);
      await expect(im.connect(user1).registerIdentity("", 1234567890123456n, "Jakarta"))
        .to.be.revertedWithCustomError(im, "InvalidName");
    });
    it("should reject invalid NIK", async function () {
      const { im, user1 } = await loadFixture(deployFixture);
      await expect(im.connect(user1).registerIdentity("Budi", 123n, "Jakarta"))
        .to.be.revertedWithCustomError(im, "InvalidNIK");
    });
    it("should reject empty domicile", async function () {
      const { im, user1 } = await loadFixture(deployFixture);
      await expect(im.connect(user1).registerIdentity("Budi", 1234567890123456n, ""))
        .to.be.revertedWithCustomError(im, "InvalidDomisili");
    });
  });

  describe("Admin Verification", function () {
    it("should verify a user", async function () {
      const { im, owner, user1 } = await loadFixture(registeredFixture);
      await expect(im.connect(owner).verifyUser(user1.address))
        .to.emit(im, "IdentityVerified").withArgs(user1.address, 1234567890123456n);
      expect(await im.isVerified(user1.address)).to.be.true;
    });
    it("should prevent non-admin verify", async function () {
      const { im, user1, user2 } = await loadFixture(registeredFixture);
      await expect(im.connect(user2).verifyUser(user1.address))
        .to.be.revertedWithCustomError(im, "OwnableUnauthorizedAccount");
    });
    it("should prevent verifying unregistered", async function () {
      const { im, owner, user3 } = await loadFixture(registeredFixture);
      await expect(im.connect(owner).verifyUser(user3.address))
        .to.be.revertedWithCustomError(im, "NotRegistered");
    });
    it("should prevent double verify", async function () {
      const { im, owner, user1 } = await loadFixture(verifiedFixture);
      await expect(im.connect(owner).verifyUser(user1.address))
        .to.be.revertedWithCustomError(im, "AlreadyVerified");
    });
    it("should revoke verification", async function () {
      const { im, owner, user1 } = await loadFixture(verifiedFixture);
      await expect(im.connect(owner).revokeUser(user1.address))
        .to.emit(im, "IdentityRevoked");
      expect(await im.isVerified(user1.address)).to.be.false;
    });
    it("should batch verify", async function () {
      const { im, owner, user1, user2 } = await loadFixture(registeredFixture);
      await im.connect(owner).batchVerifyUsers([user1.address, user2.address]);
      expect(await im.isVerified(user1.address)).to.be.true;
      expect(await im.isVerified(user2.address)).to.be.true;
      expect(await im.totalVerified()).to.equal(2);
    });
  });

  describe("Credential Checking", function () {
    it("should return true for verified + matching region", async function () {
      const { im, user1 } = await loadFixture(verifiedFixture);
      expect(await im.checkCredential(user1.address, "Jakarta")).to.be.true;
    });
    it("should return false for wrong region", async function () {
      const { im, user1 } = await loadFixture(verifiedFixture);
      expect(await im.checkCredential(user1.address, "Bali")).to.be.false;
    });
    it("should return false for unverified", async function () {
      const { im, user1 } = await loadFixture(registeredFixture);
      expect(await im.checkCredential(user1.address, "Jakarta")).to.be.false;
    });
    it("should return false for unregistered", async function () {
      const { im, user3 } = await loadFixture(deployFixture);
      expect(await im.checkCredential(user3.address, "Jakarta")).to.be.false;
    });
  });

  describe("User Enumeration", function () {
    it("should return users with pagination", async function () {
      const { im, user1, user2 } = await loadFixture(registeredFixture);
      const users = await im.getRegisteredUsers(0, 10);
      expect(users.length).to.equal(2);
      expect(users[0]).to.equal(user1.address);
    });
    it("should return empty for out-of-range", async function () {
      const { im } = await loadFixture(registeredFixture);
      const users = await im.getRegisteredUsers(100, 10);
      expect(users.length).to.equal(0);
    });
  });
});

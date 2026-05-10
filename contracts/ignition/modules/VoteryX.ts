import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * VoteryX Deployment Module
 * 
 * Deploys both contracts in the correct order:
 * 1. IdentityManager (KTP Registry)
 * 2. VotingEngine (Election Engine) — linked to IdentityManager
 * 
 * The deployer address becomes the admin (owner) of both contracts.
 */
const VoteryXModule = buildModule("VoteryX", (m) => {
  // Get the deployer account (will be the admin/owner)
  const deployer = m.getAccount(0);

  // Deploy IdentityManager first
  const identityManager = m.contract("IdentityManager", [deployer]);

  // Deploy VotingEngine with reference to IdentityManager
  const votingEngine = m.contract("VotingEngine", [identityManager, deployer]);

  return { identityManager, votingEngine };
});

export default VoteryXModule;

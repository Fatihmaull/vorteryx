# VoteryX - Credential-Based Decentralized Voting

VoteryX is a full-stack decentralized application (dApp) for regional and national elections. It combines an On-chain Digital Identity (KTP) system with a highly secure Voting Engine to ensure that only verified citizens with matching domicile can vote in specific elections.

## Architecture

*   **Smart Contracts (`/contracts`)**: Built with Solidity 0.8.20 and Hardhat.
    *   `IdentityManager.sol`: Manages user KTP registrations and admin verifications.
    *   `VotingEngine.sol`: Manages elections, candidates, and secure voting logic. Interacts with `IdentityManager` to verify voter eligibility in real-time.
*   **Frontend (`/frontend`)**: Built with Next.js 15 App Router, Tailwind CSS v4, and ethers.js v6.

## Prerequisites

*   **Node.js**: v18 or newer
*   **MetaMask**: Installed in your browser
*   **Sepolia ETH**: For deploying contracts and paying gas fees on the testnet. Get some from [Sepolia Faucet](https://sepoliafaucet.com/).
*   **RPC URL**: An Alchemy or Infura Sepolia RPC URL.

---

## 1. Smart Contract Setup & Deployment

1.  **Navigate to the contracts directory**:
    ```bash
    cd contracts
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Copy `.env.example` to `.env` and fill in your details:
    ```bash
    cp .env.example .env
    ```
    *Update `.env` with your Sepolia RPC URL, Private Key, and Etherscan API Key.*
4.  **Run Tests (Optional but recommended)**:
    ```bash
    npx hardhat test
    ```
5.  **Deploy to Sepolia**:
    ```bash
    npx hardhat ignition deploy ./ignition/modules/VoteryX.ts --network sepolia
    ```
    *Save the deployed addresses for `IdentityManager` and `VotingEngine` outputted in the terminal.*
6.  **Verify Contracts on Etherscan (Optional)**:
    ```bash
    npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
    ```

---

## 2. Frontend Setup & Execution

1.  **Navigate to the frontend directory**:
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env.local` file in the `frontend` directory:
    ```bash
    NEXT_PUBLIC_IDENTITY_MANAGER_ADDRESS=your_deployed_identity_manager_address
    NEXT_PUBLIC_VOTING_ENGINE_ADDRESS=your_deployed_voting_engine_address
    ```
4.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
5.  **Open in Browser**:
    Navigate to `http://localhost:3000`

---

## Tech Stack
- **Blockchain**: Solidity, Hardhat, OpenZeppelin, Sepolia Testnet
- **Frontend**: Next.js 15, React, Tailwind CSS v4
- **Web3**: ethers.js v6, MetaMask

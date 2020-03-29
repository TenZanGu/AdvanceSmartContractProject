## MerkleTree AirDrop

Lobsang Tenzin 101247081

The MerkleTree AirDrop contract is a way for users to withdraw tokens from an on-chain contract, From off-chain `Dapp` which stores the address of users.

This has 3 primary benefits:
- Prevents `spamming` the blockchain with many transactions
- `Saves gas` on the part of the sending for the owner
- Users who do not want tokens simply take `no action`

Users may sign up to receive tokens from the owner off-chain, and that owner will generate a Merkle tree once they have collected `enough addresses`. The owner will then deploy the contract with the `Merkle root hash` and the address of the `token (Token.sol)` which users should receive. Fund the MerkleTree AirDrop contract with the `token (Token.sol)` via transfer. Users may provide their `proof, positions, and the amount` to receive. When their input is validated, the amount specified will be transferred to their address.

## Off-Chain

- `Store` user addresses and the amount of tokens they should receive
- Construct a Merkle tree with the leaves being the keccak256 hash of the user's address and the amount of tokens (see the `generateLeaves` method in the test file for an example)
- Provide users with the `proof` associated to their leaf and the positions

## Installation

Install package

`
npm install
`

To test the contract with Truffle

`
npm test
`

# MerkleTree AirDrop

Lobsang Tenzin 101247081

The MerkleDrop contract is a way for users to withdraw tokens from an on-chain contract, based on a Merkle tree constructed off-chain.

This has 3 primary benefits:
- Prevents spamming the blockchain with many transactions
- Saves gas on the part of the sending entity
- Users who do not want tokens simply take no action

Users may sign up to receive tokens from an entity off-chain, and that entity will generate a Merkle tree once they have collected enough addresses (_enough_ being an arbitrary number). That entity will then deploy the MerkleDrop contract with the Merkle root hash and fund the contract with the token.

## Off-Chain

- Store user addresses and the amount of tokens they should receive
- Construct a Merkle tree with the leaves being the keccak256 hash of the user's address and the amount of tokens (see the `generateLeaves` method in the test file for an example)
- Provide users with the proof associated to their leaf and the positions

## On-Chain

- Deploy the contract with the Merkle root hash and the address of the token which users should receive
- Fund the MerkleDrop contract with the token via transfer
- Users may provide their proof, positions, and the amount to receive. If their input validates, the amount specified will be transferred to their address
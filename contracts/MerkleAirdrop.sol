pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { MerkleProof } from "./MerkleProof.sol";

contract MerkleAirDrop {
  bytes32 public merkleRoot;
  IERC20 public token;
  mapping(address => bool) internal claimed;

  constructor(bytes32 _merkleRoot, IERC20 _token) public {
    merkleRoot = _merkleRoot;
    token = _token;
  }

  function claim(bytes32[] calldata _proof, uint256[] calldata _positions, uint256 _amount) external {
    require(token.balanceOf(address(this)) >= _amount, "Airdrop has insufficient balance");
    require(_proof.length == _positions.length, "Proof and positions incorrect");
    require(!claimed[msg.sender], "Tokens already claimed");
    require(MerkleProof.verify(_proof, _positions, merkleRoot, keccak256(abi.encodePacked(msg.sender, _amount))), "Invalid proof");
    claimed[msg.sender] = true;
    assert(token.transfer(msg.sender, _amount));
  }
}
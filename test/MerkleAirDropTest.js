const MerkleAirDrop = artifacts.require('MerkleAirDrop')
const Token = artifacts.require('Token')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const abi = require('ethereumjs-abi')
const { shouldFail } = require('openzeppelin-test-helpers')

const generateLeaves = (addresses, amounts) => {
  let data = []
  for (let i = 0; i < addresses.length; i++) {
    let leaf = abi.soliditySHA3(
      ['address', 'uint256'],
      [addresses[i], amounts[i]])
    data.push(leaf)
  }
  return data.sort(Buffer.compare)
}

const buf2hex = x => '0x'+x.toString('hex')

contract('MerkleAirDrop', (accounts) => {
  const maintainer = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const user3 = accounts[3]
  const user4 = accounts[4]
  const user5 = accounts[5]
  const user6 = accounts[6]
  const user7 = accounts[7]
  const user8 = accounts[8]
  const user9 = accounts[9]

  let merkleAirDrop, token
  let addresses = []
  let amounts = []
  let totalPayout = 0

  for (let i = 1; i <= 9; i++) {
    addresses.push(accounts[i])
    let amount = Math.floor((Math.random() * 1000) + 1)
    amounts.push(amount)
    totalPayout += amount
  }

  const leaves = generateLeaves(addresses, amounts)
  const tree = new MerkleTree(leaves, keccak256)
  const root = tree.getRoot()
  const hexRoot = '0x'+root.toString('hex')

  beforeEach(async () => {
    token = await Token.new({from: maintainer})
    merkleAirDrop = await MerkleAirDrop.new(root, token.address, {from: maintainer})
  })

  it('deploys with the Merkle root', async () => {
    const merkleRoot = await merkleAirDrop.merkleRoot.call()
    assert.equal(merkleRoot, hexRoot)
  })

  it('deploys with the token address', async () => {
    const tokenAddress = await merkleAirDrop.token.call()
    assert.equal(tokenAddress, token.address)
  })

  describe('claim', () => {
    let leaf, proof, positions

    it('throws if the contract does not have enough funds', async () => {
      await shouldFail.reverting.withMessage(
        merkleAirDrop.claim([], [], amounts[0], {from: user1}),
        'Airdrop has insufficient balance')
    })

    context('with funding', () => {
      beforeEach(async () => {
        await token.transfer(merkleAirDrop.address, totalPayout, {from: maintainer})
      })

      it('throws if the proof and positions are different lengths', async () => {
        await shouldFail.reverting.withMessage(
          merkleAirDrop.claim([], [1], amounts[0], {from: user1}),
          'Proof and positions incorrect')
      })

      context('with a valid proof and amount', () => {

        beforeEach(async () => {
          leaf = abi.soliditySHA3(['address', 'uint256'], [addresses[0], amounts[0]])
          proof = tree.getProof(leaf).map(x => buf2hex(x.data))
          positions = tree.getProof(leaf).map(x => x.position === 'right' ? 1 : 0)
        })

        it('transfers tokens to the claimer', async () => {
          const beforeBalance = await token.balanceOf(user1)
          assert.equal(beforeBalance.toString(), 0)
          await merkleAirDrop.claim(proof, positions, amounts[0], {from: user1})
          const afterBalance = await token.balanceOf(user1)
          assert.equal(afterBalance.toString(), amounts[0])
        })

        it('throws if the user tries to claim again', async () => {
          await merkleAirDrop.claim(proof, positions, amounts[0], {from: user1})
          await shouldFail.reverting.withMessage(
            merkleAirDrop.claim(proof, positions, amounts[0], {from: user1}),
            'Tokens already claimed')
        })

        it('throws if called by an invalid user', async () => {
          await shouldFail.reverting.withMessage(
            merkleAirDrop.claim(proof, positions, amounts[0], {from: maintainer}),
            'Invalid proof')
        })

        it('allows all users to claim', async () => {
          for (let i = 0; i < addresses.length; i++) {
            let balance = await token.balanceOf(addresses[i])
            assert.equal(balance.toString(), 0)
          }
          for (let i = 0; i < addresses.length; i++) {
            leaf = abi.soliditySHA3(['address', 'uint256'], [addresses[i], amounts[i]])
            proof = tree.getProof(leaf).map(x => buf2hex(x.data))
            positions = tree.getProof(leaf).map(x => x.position === 'right' ? 1 : 0)
            await merkleAirDrop.claim(proof, positions, amounts[i], {from: addresses[i]})
          }
          for (let i = 0; i < addresses.length; i++) {
            let balance = await token.balanceOf(addresses[i])
            assert.equal(balance.toString(), amounts[i])
          }
        })
      })

      context('with an invalid proof', () => {
        beforeEach(async () => {
          leaf = abi.soliditySHA3(['address', 'uint256'], [addresses[0], amounts[0]])
          proof = tree.getProof(leaf).map(x => buf2hex(x.data))
          positions = tree.getProof(leaf).map(x => x.position === 'right' ? 1 : 0)
        })

        it('throws with message', async () => {
          await shouldFail.reverting.withMessage(
            merkleAirDrop.claim(proof, positions, amounts[0], {from: user2}),
            'Invalid proof')
        })
      })

      context('with invalid positions', () => {
        beforeEach(async () => {
          leaf = abi.soliditySHA3(['address', 'uint256'], [addresses[0], amounts[0]])
          proof = tree.getProof(leaf).map(x => buf2hex(x.data))
          // Swapped 1 & 0
          positions = tree.getProof(leaf).map(x => x.position === 'right' ? 0 : 1)
        })

        it('throws with message', async () => {
          await shouldFail.reverting.withMessage(
            merkleAirDrop.claim(proof, positions, amounts[0], {from: user1}),
            'Invalid proof')
        })
      })
    })
  })
})
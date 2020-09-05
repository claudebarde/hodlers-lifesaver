const { Tezos } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");
const { alice, bob } = require("../scripts/sandbox/accounts");
const FakeOracle = artifacts.require("FakeOracle");
const Hodlers = artifacts.require("Hodlers");

const signerFactory = async pk => {
  await Tezos.setProvider({ signer: new InMemorySigner(pk) });
  return Tezos;
};

contract("Hodlers Lifesaver", () => {
  let storage,
    contract,
    contractAddress,
    fakeOracle,
    fakeOracleAddress,
    fakeOracleStorage;

  before(async () => {
    await signerFactory(alice.sk);

    contract = await Hodlers.deployed();
    fakeOracle = await FakeOracle.deployed();
    // this code bypasses Truffle config to be able to have different signers
    // until I find how to do it directly with Truffle
    await Tezos.setProvider({ rpc: "http://localhost:8732" });
    await signerFactory(alice.sk);
    /**
     * Display the current contract address for debugging purposes
     */
    console.log("Contract deployed at:", contract.address);
    console.log("Fake oracle deployed at:", fakeOracle.address);
    contractAddress = contract.address;
    fakeOracleAddress = fakeOracle.address;
    contract = await Tezos.contract.at(contractAddress);
    fakeOracle = await Tezos.contract.at(fakeOracleAddress);
    storage = await contract.storage();
    fakeOracleStorage = await fakeOracle.storage();

    // updates oracle address in Hodlers contract
    try {
      const op = await contract.methods.update_oracle(fakeOracleAddress).send();
      await op.confirmation();
    } catch (error) {
      console.log(error);
    }
  });

  it("Alice should be the admin", () => {
    assert.equal(alice.pkh, storage.admin);
  });

  it("Value in fake oracle should be a number", () => {
    assert.isNotNaN(fakeOracleStorage);
  });

  it("Should allow Alice to deposit funds", async () => {
    const deposit = 5000000;

    try {
      const op = await contract.methods
        .hodl([["unit"]])
        .send({ amount: deposit, mutez: true });
      await op.confirmation();
    } catch (error) {
      console.log(error);
    }

    storage = await contract.storage();
    const account = await storage.ledger.get(alice.pkh);

    assert.equal(account.deposit.toNumber(), deposit);
    assert.equal(account.price.toNumber(), fakeOracleStorage);
  });

  it("should manually decrease price in oracle contract to prevent Alice from withdrawing her funds", async () => {
    // updates price in oracle
    try {
      const op = await fakeOracle.methods.update(fakeOracleStorage - 1).send();
      await op.confirmation();
    } catch (error) {
      console.log(error);
    }
    // Alice tries to withdraw her funds
    let err;

    try {
      const op = await contract.methods.withdraw([["unit"]]).send();
      await op.confirmation();
    } catch (error) {
      err = error.message;
    }

    assert.equal(err, "NO_WITHDRAWAL_ALLOWED");
  });

  it("should manually increase price in oracle contract to allow Alice withdrawal", async () => {
    const aliceBalance = await Tezos.tz.getBalance(alice.pkh);
    // updates price in oracle
    try {
      const op = await fakeOracle.methods.update(fakeOracleStorage + 1).send();
      await op.confirmation();
    } catch (error) {
      console.log(error);
    }
    // Alice tries to withdraw her funds
    try {
      const op = await contract.methods.withdraw([["unit"]]).send();
      await op.confirmation();
    } catch (error) {
      console.log(error);
    }

    const account = await storage.ledger.get(alice.pkh);
    const aliceNewBalance = await Tezos.tz.getBalance(alice.pkh);

    assert.isUndefined(account);
    assert.isAbove(aliceNewBalance.toNumber(), aliceBalance.toNumber());
  });
});

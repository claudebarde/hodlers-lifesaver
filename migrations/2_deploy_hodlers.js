const Hodlers = artifacts.require("Hodlers");
const { MichelsonMap } = require("@taquito/taquito");
const { alice } = require("../scripts/sandbox/accounts");

const initialStorage = {
  ledger: new MichelsonMap(),
  oracle: alice.pkh,
  admin: alice.pkh
};

module.exports = async (deployer, _network, accounts) => {
  deployer.deploy(Hodlers, initialStorage);
};

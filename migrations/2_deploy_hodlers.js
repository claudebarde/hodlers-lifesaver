const Hodlers = artifacts.require("Hodlers");
const { MichelsonMap } = require("@taquito/taquito");
const { alice } = require("../scripts/sandbox/accounts");
const faucet = require("../faucet");

const initialStorage = {
  ledger: new MichelsonMap(),
  oracle: "KT1VsWxgE683MiXoaevLbXtpJqpWrcaWaQV7",
  admin: faucet.pkh
};

module.exports = async (deployer, _network, accounts) => {
  deployer.deploy(Hodlers, initialStorage);
};

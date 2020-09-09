const FakeOracle = artifacts.require("FakeOracle");

module.exports = async (deployer, _network, accounts) => {
  deployer.deploy(FakeOracle, 2692266);
};

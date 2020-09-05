const FakeHarbinger = artifacts.require("FakeHarbinger");
const { MichelsonMap } = require("@taquito/taquito");

const initialStorage = {
  assetCodes: [
    "BAT-USDC",
    "BTC-USD",
    "COMP-USD",
    "DAI-USDC",
    "ETH-USD",
    "KNC-USD",
    "LINK-USD",
    "REP-USD",
    "XTZ-USD",
    "ZRX-USD"
  ],
  /*assetMap: MichelsonMap.fromLiteral({
    "XTZ-USD": {
      computedPrice: 2672572,
      lastUpdateTime: Math.round(new Date() / 1000),
      prices: {
        first: 3126,
        last: 3131,
        saved: MichelsonMap.fromLiteral({
          3126: 19967702310000000,
          3127: 5877960000000,
          3128: 203683260080000,
          3131: 1101865696570000
        }),
        sum: 22003931981510000
      },
      volumes: {
        first: 3126,
        last: 3131,
        saved: MichelsonMap.fromLiteral({
          3126: 7477700000,
          3127: 2190000,
          3131: 408290000
        }),
        sum: 8233240000
      }
    }
  }),*/
  assetMap: new MichelsonMap(),
  numDataPoints: 6,
  oracleContract: "KT1P7D7jt3PfjMpsEKPyao1kHQR93t7XR5zh"
};

module.exports = async (deployer, _network, accounts) => {
  deployer.deploy(FakeHarbinger, initialStorage);
};

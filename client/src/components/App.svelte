<script>
  import { onMount, onDestroy } from "svelte";
  import { Tezos } from "@taquito/taquito";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import img from "../../public/images/weak-hands.png";
  import wallet from "../../public/images/icons8-wallet-48.png";
  import touchid from "../../public/images/icons8-touch-id-48.png";

  let interval, oracle, contract, userAddress, userBalance, userAccount;
  let rate = 0;
  let depositAmount = "";
  const harbinger = "KT1VsWxgE683MiXoaevLbXtpJqpWrcaWaQV7"; // harbinger contract address
  const hodlers = "KT1JdvuHZq54itykVeog5MHmnySnR28KVWBN"; // hodlers contract address
  let loadingAccount = false;
  let loadingHodl = false;

  const fetchXTZtoUSD = async () => {
    const storage = await oracle.storage();
    const rate = await storage.assetMap.get("XTZ-USD");
    return rate.computedPrice.toNumber();
  };

  const connectWallet = async () => {
    loadingAccount = true;
    const wallet = new BeaconWallet({
      name: "Hodlers Lifesaver",
      eventHandlers: {
        P2P_LISTEN_FOR_CHANNEL_OPEN: {
          handler: async data => {
            console.log("Listening to P2P channel:", data);
          }
        },
        P2P_CHANNEL_CONNECT_SUCCESS: {
          handler: async data => {
            console.log("Channel connected:", data);
          }
        },
        PERMISSION_REQUEST_SENT: {
          handler: async data => {
            console.log("Permission request sent:", data);
          }
        },
        PERMISSION_REQUEST_SUCCESS: {
          handler: async data => {
            console.log("Wallet is connected:", data);
          }
        },
        OPERATION_REQUEST_SENT: {
          handler: async data => {
            console.log("Request broadcast:", data);
          }
        },
        OPERATION_REQUEST_SUCCESS: {
          handler: async data => {
            console.log("Request broadcast success:", data);
          }
        }
      }
    });
    await wallet.requestPermissions({
      network: {
        type: "carthagenet",
        rpcUrl: "https://carthagenet.smartpy.io"
      }
    });
    Tezos.setWalletProvider(wallet);
    userAddress = await wallet.getPKH();
    userBalance = (await Tezos.tz.getBalance(userAddress)).toNumber();
    // checks if user already has a deposit in the contract
    const storage = await contract.storage();
    const account = await storage.ledger.get(userAddress);
    if (account) {
      userAccount = account;
    } else {
      userAccount = undefined;
    }

    loadingAccount = false;
  };

  const deposit = async () => {
    if (!isNaN(+depositAmount)) {
      try {
        loadingHodl = true;
        const op = await contract.methods
          .hodl([["unit"]])
          .send({ amount: depositAmount * 10 ** 6, mutez: true });
        await op.confirmation();
      } catch (error) {
        console.log(error);
      } finally {
        const account = await storage.ledger.get(userAddress);
        if (account) {
          userAccount = account;
        } else {
          userAccount = undefined;
        }
        loadingHodl = false;
        depositAmount = "";
      }
    }
  };

  onMount(async () => {
    Tezos.setRpcProvider("https://carthagenet.smartpy.io");
    oracle = await Tezos.wallet.at(harbinger);
    rate = await fetchXTZtoUSD();
    contract = await Tezos.wallet.at(hodlers);

    interval = setInterval(async () => {
      rate = await fetchXTZtoUSD();
    }, 1000 * 60 * 5);
  });

  onDestroy(() => clearInterval(interval));
</script>

<style>
  main {
    height: 100%;
    width: 100%;
    display: grid;
    grid-template: auto / 1fr 1fr;
    place-items: center;
    text-align: center;
  }

  .app {
    width: 80%;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px,
      rgba(0, 0, 0, 0.04) 0px 16px 24px, rgba(0, 0, 0, 0.01) 0px 24px 32px;
    border-radius: 30px;
    padding: 10px;
  }

  .right-box {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }

  .right-box__row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 0px;
    margin: 0px;
    font-size: 0.9rem;
  }

  .right-box__row img {
    width: 25px;
    height: 25px;
    padding: 0px 10px;
  }

  .button {
    width: 70%;
    margin: 10px;
    padding: 15px;
    font-size: 1rem;
    border-radius: 30px;
    border: none;
    cursor: pointer;
    transition: 0.3s;
    outline: none;
    margin-bottom: 14px;
  }

  .button:active {
    margin-bottom: 10px;
    margin-top: 14px;
  }

  .button.info {
    background-color: #bee3f8;
    color: #3182ce;
  }

  .button.info:hover {
    background-color: #90cdf4;
  }

  .button.success {
    background-color: #c6f6d5;
    color: #38a169;
  }

  .button.success:hover {
    background-color: #9ae6b4;
  }

  .user-info {
    width: 60%;
    margin: 0 auto;
  }

  .input-deposit {
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: 20px 0px;
  }

  .input-deposit input {
    padding: 15px;
    font-size: 1rem;
    border: solid 1px #bee3f8;
    border-right: none;
    border-top-left-radius: 30px;
    border-bottom-left-radius: 30px;
    outline: none;
    text-align: center;
  }

  .input-deposit button {
    padding: 15px;
    font-size: 1rem;
    border: solid 1px #bee3f8;
    border-left: none;
    background-color: #bee3f8;
    color: #3182ce;
    border-top-right-radius: 30px;
    border-bottom-right-radius: 30px;
    outline: none;
    cursor: pointer;
  }

  .input-deposit button:hover {
    background-color: #90cdf4;
  }
</style>

{#if !loadingAccount && userAddress && userBalance}
  <div class="right-box">
    <p class="right-box__row">
      <img src={touchid} alt="touch-id" />
      {userAddress.slice(0, 5) + '...' + userAddress.slice(-5)}
    </p>
    <p class="right-box__row">
      <img src={wallet} alt="wallet" />
      ꜩ {(userBalance / 1000000).toLocaleString('en-US')}
    </p>
  </div>
{/if}
<main>
  <div>
    <img src={img} alt="weak hands pic" />
  </div>
  <div class="app">
    <h1>Hodlers Lifesaver</h1>
    <h3>Put your tez in the smart contract.</h3>
    <h3>
      Withdraw them only if
      <br />
      the exchange rate went up.
    </h3>
    <p>Current exchange rate: 1 tez = ${rate / 10 ** 6}</p>
    <br />
    {#if loadingAccount}
      <p>Loading account info</p>
    {:else if !loadingAccount && userAddress && userBalance}
      <div class="user-info">
        {#if userAccount}
          {#if userAccount.price.toNumber() < rate}
            <p>
              You have ꜩ {(userAccount.deposit.toNumber() / 1000000).toLocaleString('en-US')}
              locked
            </p>
            <button class="button success">Withdraw</button>
          {:else}
            <button class="button">No Withdrawal</button>
          {/if}
        {:else}
          <div class="input-deposit">
            <input type="text" bind:value={depositAmount} />
            <button class="button-input" on:click={deposit}>
              {loadingHodl ? 'Loading' : 'Deposit'}
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <button class="button info" disabled={!contract} on:click={connectWallet}>
        Connect Wallet
      </button>
    {/if}
  </div>
</main>

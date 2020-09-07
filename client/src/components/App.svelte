<script>
  import { onMount, onDestroy } from "svelte";
  import { Tezos } from "@taquito/taquito";
  import { BeaconWallet } from "@taquito/beacon-wallet";
  import img from "../../public/images/weak-hands.png";
  import wallet from "../../public/images/icons8-wallet-48.png";
  import touchid from "../../public/images/icons8-touch-id-48.png";
  import vault from "../../public/images/icons8-safe-48.png";
  import code from "../../public/images/icons8-code-48.png";
  import github from "../../public/images/icons8-github-50.png";

  let interval, oracle, contract, userAddress, userBalance, userAccount;
  let rate = 0;
  let network = "mainnet";
  let depositAmount = "";
  /* Carthagenet addresses for testing
   * const harbinger = "KT1VsWxgE683MiXoaevLbXtpJqpWrcaWaQV7";
   * const hodlers = "KT1HmVUWnbY4yf4QTfx7M7abQBetKTGE5CwH";
   */
  const harbinger = "KT1Q4tVwWtnd8BQ9kSZ96bd5atf3dVkzhdHv"; // harbinger contract address
  const hodlers = "KT1UHX2yb1D64iEXMwfh1oMwjyDQoeAKPson"; // hodlers contract address
  let loadingAccount = false;
  let loadingHodl = false;
  let loadingWithdraw = false;
  let loadingRefresh = false;

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
        type: network,
        rpcUrl: `https://${network}.smartpy.io`
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
          .send({ amount: Math.round(depositAmount * 10 ** 6), mutez: true });
        await op.confirmation();
      } catch (error) {
        console.log(error);
      } finally {
        const storage = await contract.storage();
        const account = await storage.ledger.get(userAddress);
        if (account) {
          userAccount = account;
        } else {
          userAccount = undefined;
        }
        loadingHodl = false;
        depositAmount = "";
        userBalance = (await Tezos.tz.getBalance(userAddress)).toNumber();
      }
    }
  };

  const withdraw = async () => {
    try {
      loadingWithdraw = true;
      const op = await contract.methods.withdraw([["unit"]]).send();
      await op.confirmation();
    } catch (error) {
      console.log(error);
    } finally {
      loadingWithdraw = false;
      userBalance = (await Tezos.tz.getBalance(userAddress)).toNumber();
      userAccount = undefined;
    }
  };

  const refresh = async () => {
    loadingRefresh = true;

    const storage = await contract.storage();
    const account = await storage.ledger.get(userAddress);
    if (account) {
      userAccount = account;
    } else {
      userAccount = undefined;
    }

    loadingRefresh = false;
  };

  onMount(async () => {
    Tezos.setRpcProvider(`https://${network}.smartpy.io`);
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
    grid-template: auto / 1fr 2fr;
    place-items: center;
    text-align: center;
  }

  .app {
    width: 70%;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.01) 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 4px 8px,
      rgba(0, 0, 0, 0.04) 0px 16px 24px, rgba(0, 0, 0, 0.01) 0px 24px 32px;
    border-radius: 30px;
    padding: 10px;
  }

  .top-box {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }

  .top-box__row {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    padding: 0px;
    margin: 0px;
    font-size: 0.9rem;
  }

  .top-box__row img {
    width: 25px;
    height: 25px;
    padding: 0px 10px;
  }

  .bottom-box {
    position: absolute;
    bottom: 10px;
    right: 10px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }

  .bottom-box a img {
    width: 25px;
    height: 25px;
    padding: 0px 10px;
  }

  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
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
    font-weight: bold;
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
    color: #2b6cb0;
  }

  .button.success {
    background-color: #c6f6d5;
    color: #38a169;
  }

  .button.success:hover {
    background-color: #9ae6b4;
    color: #2f855a;
  }

  .button.error {
    background-color: #fed7d7;
    color: #e53e3e;
  }

  .button.error:hover {
    background-color: #feb2b2;
    color: #c53030;
  }

  .button.round {
    border-radius: 50%;
    font-weight: bold;
    font-size: 1.2rem;
    height: 50px;
    width: 50px;
    padding: 0px;
  }

  .button.round.spin {
    animation: rotate 1.5s linear infinite;
  }
  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .user-info {
    width: 70%;
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

  @media only screen and (max-width: 700px) {
    main {
      display: grid;
      grid-template: auto / 1fr;
    }
    #banner {
      display: none;
    }

    .app {
      width: 80%;
    }

    .user-info {
      width: 100%;
    }

    .top-box__row {
      font-size: 0.8rem;
    }

    .top-box__row img {
      width: 20px;
      height: 20px;
    }

    .top-box__row img {
      width: 20px;
      height: 20px;
    }
  }
</style>

{#if !loadingAccount && userAddress && userBalance}
  <div class="top-box">
    <p class="top-box__row">
      <img src={touchid} alt="touch-id" />
      {userAddress.slice(0, 5) + '...' + userAddress.slice(-5)}
    </p>
    <p class="top-box__row">
      <img src={wallet} alt="wallet" />
      ꜩ {(userBalance / 1000000).toLocaleString('en-US')}
    </p>
    <p class="top-box__row">
      <img src={vault} alt="safe" />
      ꜩ {userAccount ? userAccount.deposit.toNumber() / 10 ** 6 : 0}
    </p>
  </div>
{/if}
<main>
  <div id="banner">
    <img src={img} alt="weak hands pic" />
  </div>
  <div class="app">
    <h1>Hodlers Lifesaver</h1>
    <h3>Put your tez in the smart contract.</h3>
    <h3>
      Withdraw them only if
      <br />
      the exchange rate goes up.
    </h3>
    <p>Current exchange rate: 1 tez = ${rate / 10 ** 6}</p>
    <br />
    {#if loadingAccount}
      <p>Loading account info...</p>
      <br />
    {:else if !loadingAccount && userAddress && userBalance}
      <div class="user-info">
        {#if userAccount}
          {#if userAccount.price.toNumber() < rate}
            <p>You have ꜩ {userAccount.deposit.toNumber() / 10 ** 6} locked</p>
            <button
              class="button success"
              disabled={loadingWithdraw}
              on:click={withdraw}>
              {loadingWithdraw ? 'Transferring' : 'Withdraw'}
            </button>
          {:else}
            <p>
              You locked your tez when 1 tez was ${userAccount.price.toNumber() / 10 ** 6}
            </p>
            <div class="buttons">
              <button class="button error">
                <span>&#9888;</span>
                No Withdrawal
              </button>
              <button
                class={`button round info ${loadingRefresh ? 'spin' : ''}`}
                on:click={refresh}>
                &#10227;
              </button>
            </div>
          {/if}
        {:else}
          <div class="input-deposit">
            <input type="text" bind:value={depositAmount} />
            <button
              class="button-input"
              disabled={loadingHodl}
              on:click={deposit}>
              {loadingHodl ? 'Loading' : 'Deposit'}
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <button
        class={`button ${!contract ? 'disabled' : 'info'}`}
        disabled={!contract}
        on:click={connectWallet}>
        Connect Wallet
      </button>
    {/if}
  </div>
</main>
<div class="bottom-box">
  <a
    href={`https://better-call.dev/${network}/${hodlers}/operations`}
    target="_blank"
    rel="noopener noreferrer">
    <img src={code} alt="code" />
  </a>
  <a
    href="https://github.com/claudebarde/hodlers-lifesaver"
    target="_blank"
    rel="noopener noreferrer">
    <img src={github} alt="code" />
  </a>
</div>

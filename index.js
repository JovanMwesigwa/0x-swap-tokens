const axios = require('axios')
const { ethers } = require('ethers')
const BigNumber = require('bignumber.js')
const qs = require('qs')
require('dotenv').config()
const ERC20_ABI = require('./abi.json')

const walletAddress = process.env.WALLET_ADDRESS

// // GOERLI DATA
// const ZERO_EX_ADDRESS = '0xf91bb752490473b8342a3e964e855b9f9a2a668e'
// const wethAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
// const daiAddress = '0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60'
// const GOERLI_URL_TESTNET = process.env.GOERLI_URL_TESTNET

// // ROPSTEN DATA
// Tokens
const tokenFrom = {
  name: 'Wrapped Ether',
  address: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
  symbol: 'ETH',
  decimals: 18,
}

const tokenTo = {
  name: 'Wrapped BTC',
  address: '0xBde8bB00A7eF67007A96945B3a3621177B615C44',
  symbol: 'WBTC',
  decimals: 18,
}
const ZERO_EX_ADDRESS = '0xdef1c0ded9bec7f1a1670819833240f027b25eff'
// const tokenFromAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab'
// const tokenToAddress = '0xaD6D458402F60fD3Bd25163575031ACDce07538D'
const ROPTSTEN_URL_TESTNET = process.env.ROPTSTEN_URL_TESTNET

const provider = new ethers.providers.JsonRpcProvider(ROPTSTEN_URL_TESTNET)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const getPrice = async (amountFrom) => {
  try {
    const params = {
      sellToken: tokenFrom.address,
      buyToken: tokenTo.address,
      sellAmount: amountFrom * 10 ** 18,
    }
    await axios
      .get(`https://ropsten.api.0x.org/swap/v1/price?${qs.stringify(params)}`)
      .then((res) => {
        const estimatedGasPrice = res.data.estimatedGas
        const buyAmount = res.data.buyAmount / 10 ** 18
        // console.log(res.data);
        console.log(`You get: ${buyAmount} DAI`)
        console.log(`Gas: ${estimatedGasPrice} DAI`)
      })
      .catch((err) => {
        console.log(err.response)
      })
  } catch (error) {
    console.log(error.response)
  }
}

const getQuote = async (amountFrom) => {
  try {
    const params = {
      sellToken: tokenFrom.symbol,
      buyToken: tokenTo.address,
      sellAmount: amountFrom * 10 ** 18,
      takerAddress: walletAddress,
      slippagePercentage: 0.03,
      //   skipValidation: true,
    }
    const res = await axios.get(
      `https://ropsten.api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    )
    const estimatedGasPrice = res.data.estimatedGas
    // const buyAmount = res.data.buyAmount / 10 ** 18
    const buyAmount = res.data.buyAmount
    console.log(`You get: ${buyAmount} DAI`)
    console.log(`Gas: ${estimatedGasPrice} DAI`)
    return res.data
  } catch (error) {
    console.log(error.response)
  }
}

const approve = async () => {
  try {
    const erc20Contract = new ethers.Contract(
      tokenFrom.address,
      ERC20_ABI,
      signer
    )
    const approvalAmount = ethers.utils.parseUnits('1', 18).toString()

    const tx = await erc20Contract.approve(ZERO_EX_ADDRESS, approvalAmount)
    await tx.wait(1)
    console.log('Approved!')
  } catch (error) {
    console.log(error.response)
  }
}

const swapTokens = async () => {
  try {
    const tx = await getQuote(0.001)

    const txObj = {
      from: tx.from,
      to: tx.to,
      data: tx.data,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gasLimit: ethers.utils.hexlify(1000000),
    }

    await approve()

    console.log('Broadcasting....')
    // Send the tx
    const sentTx = await signer.sendTransaction(txObj)
    await sentTx.wait(1)
    console.log(sentTx)
    console.log(`-------------------------------------------`)
  } catch (error) {
    console.log(error)
  }
}

const getBalance = async () => {
  const contract = new ethers.Contract(tokenTo.address, ERC20_ABI, signer)
  const balance = await contract.balanceOf(walletAddress)
  console.log(balance.toString() / 10 ** 18)
}

getQuote(0.001, '0xbF0B2D77F5095a28a48C7e57BE99841434FbBB26')
// swapTokens()
// getBalance()

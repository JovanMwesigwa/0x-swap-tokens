const axios = require('axios')
const { ethers } = require('ethers')
const BigNumber = require('bignumber.js')
const qs = require('qs')
require('dotenv').config()
const ERC20_ABI = require('./abi.json')

const walletAddress = process.env.WALLET_ADDRESS
const ZERO_EX_ADDRESS = '0xdef1c0ded9bec7f1a1670819833240f027b25eff'

const tokenFrom = {
  symbol: 'ETH',
  address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  name: 'Ether',
  decimals: 18,
}

const tokenTo = {
  symbol: 'USDT',
  address: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
  name: 'Tether USD',
  decimals: 6,
}

const provider = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_MAINNET
)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const getQuote = async (amountFrom) => {
  try {
    const params = {
      sellToken: tokenFrom.address,
      buyToken: tokenTo.address,
      //   sellAmount: 1000000000000000000,
      sellAmount: amountFrom * 10 ** 18,
      //   takerAddress: walletAddress,
      //   slippagePercentage: 0.03,
      skipValidation: true,
    }
    const res = await axios.get(
      `https://optimism.api.0x.org/swap/v1/quote?${qs.stringify(params)}`
    )
    const estimatedGasPrice = res.data.estimatedGas / 10 ** tokenTo.decimals
    const buyAmount = res.data.buyAmount / 10 ** tokenTo.decimals
    // const buyAmount = res.data.buyAmount
    console.log(`You get: ${buyAmount} USDT`)
    console.log(`Gas: ${estimatedGasPrice} USD`)
    return res.data
  } catch (error) {
    console.log(error.response.data)
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

const getBalance = async () => {
  const balance = await provider.getBalance(walletAddress)
  console.log(balance.toString() / 10 ** 18)
  const formattedBalance = balance.toString() / 10 ** 18
  return formattedBalance
}

const getTokenToBalance = async () => {
  const contract = new ethers.Contract(tokenTo.address, ERC20_ABI, signer)
  const balance = await contract.balanceOf(walletAddress)
  console.log(balance.toString() / 10 ** 18)
  const formattedBalance = balance.toString() / 10 ** 18
  return formattedBalance
}

const swapTokens = async (amount) => {
  try {
    const tx = await getQuote(amount)

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

    const balance = await getBalance()

    if (balance === 0) {
      console.log('Insufficient funds!')
      return
    }
    // Send the tx
    const sentTx = await signer.sendTransaction(txObj)
    await sentTx.wait(1)
    console.log(sentTx)
    console.log(`-------------------------------------------`)
  } catch (error) {
    console.log(error)
  }
}

// swapTokens(25)
getQuote(0.006159)
// getTokenToBalance()
// getBalance()

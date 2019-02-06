import MarketplaceContract from 'origin-contracts/build/contracts/V00_Marketplace'
import OriginTokenContract from 'origin-contracts/build/contracts/OriginToken'
import TokenContract from 'origin-contracts/build/contracts/TestToken'
import IdentityEventsContract from 'origin-contracts/build/contracts/IdentityEvents'

import Web3 from 'web3'
import EventSource from 'origin-eventsource'

import eventCache from './utils/eventCache'
import genericEventCache from './utils/genericEventCache'
import pubsub from './utils/pubsub'

let metaMask, metaMaskEnabled, web3WS, wsSub, web3
const HOST = process.env.HOST || 'localhost'

let OriginMessaging
if (typeof window !== 'undefined') {
  OriginMessaging = require('origin-messaging-client').default
}

let OriginLinkerClient
if (typeof window !== 'undefined') {
  OriginLinkerClient = require('origin-linker-client').default
}

const Configs = {
  mainnet: {
    provider: 'https://mainnet.infura.io/v3/98df57f0748e455e871c48b96f2095b2',
    providerWS: 'wss://mainnet.infura.io/ws',
    ipfsGateway: 'https://ipfs.originprotocol.com',
    ipfsRPC: 'https://ipfs.originprotocol.com',
    ipfsEventCache: 'QmbNYwVLSLmaKmuA1R2v7VU9w1z3jxJVbTJNtstRU4TzPr',
    discovery: 'https://discovery.originprotocol.com',
    bridge: 'https://bridge.originprotocol.com',
    IdentityEvents: '0x8ac16c08105de55a02e2b7462b1eec6085fa4d86',
    IdentityEvents_Epoch: '7046530',
    IdentityEvents_EventCache: 'QmWkUzib3YaGBMtrF5Wam7KLPFZ4VhWqS3NrAd5aVS3qeP',
    attestationIssuer: '0x8EAbA82d8D1046E4F242D4501aeBB1a6d4b5C4Aa',
    OriginToken: '0x8207c1ffc5b6804f6024322ccf34f29c3541ae26',
    V00_Marketplace: '0x819bb9964b6ebf52361f1ae42cf4831b921510f9',
    V00_Marketplace_Epoch: '6436157',
    tokens: [
      {
        id: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        type: 'Standard',
        name: 'DAI Stablecoin',
        symbol: 'DAI',
        decimals: '18'
      },
      {
        id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        type: 'Standard',
        name: 'USDC Stablecoin',
        symbol: 'USDC',
        decimals: '6'
      },
      {
        id: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd',
        type: 'Standard',
        name: 'Gemini Dollar',
        symbol: 'GUSD',
        decimals: '2'
      }
    ],
    affiliate: '0x7aD0fa0E2380a5e0208B25AC69216Bd7Ff206bF8',
    arbitrator: '0x64967e8cb62b0cd1bbed27bee4f0a6a2e454f06a'
  },
  rinkeby: {
    provider: 'https://rinkeby.infura.io',
    providerWS: 'wss://rinkeby.infura.io/ws',
    ipfsGateway: 'https://ipfs.staging.originprotocol.com',
    ipfsRPC: `https://ipfs.staging.originprotocol.com`,
    ipfsEventCache: 'QmdMTYdXtKHzhTHDuUmx4eGG372pwbK4sQptPtoS6q3LsK',
    discovery: 'https://discovery.staging.originprotocol.com',
    bridge: 'https://bridge.staging.originprotocol.com',
    IdentityEvents: '0x160455a06d8e5aa38862afc34e4eca0566ee4e7e',
    IdentityEvents_Epoch: '3670528',
    OriginToken: '0xa115e16ef6e217f7a327a57031f75ce0487aadb8',
    V00_Marketplace: '0xe842831533c4bf4b0f71b4521c4320bdb669324e',
    V00_Marketplace_Epoch: '3086315',
    affiliate: '0xc1a33cda27c68e47e370ff31cdad7d6522ea93d5',
    arbitrator: '0xc9c1a92ba54c61045ebf566b154dfd6afedea992',
    messaging: {
      ipfsSwarm:
        '/dnsaddr/messaging.staging.originprotocol.com/tcp/443/wss/ipfs/QmR4xhzHSKJiHmhCTf3tWXLe3UV4RL5kqUJ2L81cV4RFbb',
      messagingNamespace: 'origin:staging',
      globalKeyServer: 'https://messaging-api.staging.originprotocol.com'
    }
  },
  rinkebyTst: {
    provider: 'https://rinkeby.infura.io',
    providerWS: 'wss://rinkeby.infura.io/ws',
    ipfsGateway: 'https://ipfs.staging.originprotocol.com',
    ipfsRPC: `https://ipfs.staging.originprotocol.com`,
    bridge: 'https://bridge.staging.originprotocol.com'
  },
  kovanTst: {
    provider: 'https://kovan.infura.io',
    providerWS: 'wss://kovan.infura.io/ws',
    ipfsGateway: 'https://ipfs.staging.originprotocol.com',
    ipfsRPC: `https://ipfs.staging.originprotocol.com`,
    OriginToken: '0xf2D5AeA9057269a1d97A952BAf5E1887462c67b6',
    V00_Marketplace: '0x66E8c312dC89599c84A93353d6914631ce7857Cc',
    V00_Marketplace_Epoch: '10135260'
  },
  localhost: {
    provider: `http://${HOST}:8545`,
    providerWS: `ws://${HOST}:8545`,
    ipfsGateway: `http://${HOST}:8080`,
    ipfsRPC: `http://${HOST}:5002`,
    bridge: 'https://bridge.staging.originprotocol.com',
    automine: 2000,
    affiliate: '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2',
    arbitrator: '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544',
    linker: `http://${HOST}:3008`,
    linkerWS: `ws://${HOST}:3008`

    // messaging: {
    //   ipfsSwarm:
    //     '/ip4/127.0.0.1/tcp/9012/ws/ipfs/QmYsCaLzzso7kYuAZ8b5DwhpwGvgzKyFtvs37bG95GTQGA',
    //   messagingNamespace: 'dev',
    //   globalKeyServer: 'http://127.0.0.1:6647'
    // }
  },
  test: {
    provider: `http://${HOST}:8545`,
    providerWS: `ws://${HOST}:8545`,
    ipfsGateway: `http://${HOST}:8080`,
    ipfsRPC: `http://${HOST}:5002`
  }
}

const DefaultMessagingConfig = {
  ipfsSwarm:
    '/dnsaddr/messaging.dev.originprotocol.com/tcp/443/wss/ipfs/Qma8wRkeXeYtE3RQfqFDGjsKCEqXR5CGxfmRxvus9aULcs',
  messagingNamespace: 'origin:dev',
  globalKeyServer: 'https://messaging-api.dev.originprotocol.com'
}

const context = {}

// web3.js version 35 + 36 need this hack...
function applyWeb3Hack(web3Instance) {
  if (!web3Instance.version.match(/(35|36)$/)) return web3Instance

  web3Instance.eth.abi.decodeParameters = function(outputs, bytes) {
    if (bytes === '0x') bytes = '0x00'
    return web3Instance.eth.abi.__proto__.decodeParameters(outputs, bytes)
  }
  return web3Instance
}

export function setNetwork(net, customConfig) {
  let config = JSON.parse(JSON.stringify(Configs[net]))
  if (!config) {
    return
  }
  if (net === 'test') {
    config = { ...config, ...customConfig }
  } else if (net === 'localhost') {
    config.OriginToken = window.localStorage.OGNContract
    config.V00_Marketplace = window.localStorage.marketplaceContract
    config.V00_UserRegistry = window.localStorage.userRegistryContract
    config.IdentityEvents = window.localStorage.identityEventsContract
  }
  context.net = net
  context.config = config
  context.automine = config.automine

  context.ipfsGateway = config.ipfsGateway
  context.ipfsRPC = config.ipfsRPC
  context.discovery = config.discovery

  delete context.marketplace
  delete context.marketplaceExec
  delete context.ogn
  delete context.ognExec
  delete context.marketplaces
  delete context.tokens
  delete context.identityEvents
  delete context.metaMask
  if (wsSub) {
    wsSub.unsubscribe()
  }

  web3 = applyWeb3Hack(new Web3(config.provider))
  if (typeof window !== 'undefined') {
    window.localStorage.ognNetwork = net
    window.web3 = web3
  }
  context.web3 = web3
  context.web3Exec = web3

  if (typeof window !== 'undefined') {
    const MessagingConfig = config.messaging || DefaultMessagingConfig
    MessagingConfig.personalSign = metaMask && metaMaskEnabled ? true : false
    context.messaging = OriginMessaging({ ...MessagingConfig, web3 })

    context.linker = OriginLinkerClient({
      httpUrl: config.linker,
      wsUrl: config.linkerWS,
      web3: context.web3
    })
  }

  context.metaMaskEnabled = metaMaskEnabled
  if (typeof window !== 'undefined' && window.localStorage.privateKeys) {
    JSON.parse(window.localStorage.privateKeys).forEach(key =>
      web3.eth.accounts.wallet.add(key)
    )
    web3.eth.defaultAccount = window.localStorage.defaultAccount
  }

  context.EventBlock = config.V00_Marketplace_Epoch || 0

  setMarketplace(config.V00_Marketplace, config.V00_Marketplace_Epoch)
  setIdentityEvents(config.IdentityEvents, config.IdentityEvents_Epoch)

  if (typeof window !== 'undefined') {
    web3WS = applyWeb3Hack(new Web3(config.providerWS))
    wsSub = web3WS.eth.subscribe('newBlockHeaders').on('data', blockHeaders => {
      context.marketplace.eventCache.updateBlock(blockHeaders.number)
      context.identityEvents.eventCache.updateBlock(blockHeaders.number)
      context.eventSource.resetCache()
      pubsub.publish('NEW_BLOCK', {
        newBlock: { ...blockHeaders, id: blockHeaders.hash }
      })
    })
    web3.eth.getBlockNumber().then(block => {
      web3.eth.getBlock(block).then(blockHeaders => {
        if (blockHeaders) {
          context.marketplace.eventCache.updateBlock(blockHeaders.number)
          context.identityEvents.eventCache.updateBlock(blockHeaders.number)
          context.eventSource.resetCache()
          pubsub.publish('NEW_BLOCK', {
            newBlock: { ...blockHeaders, id: blockHeaders.hash }
          })
        }
      })
    })
    context.pubsub = pubsub
  }

  context.tokens = config.tokens || []
  if (config.OriginToken) {
    context.ogn = new web3.eth.Contract(
      OriginTokenContract.abi,
      config.OriginToken
    )
    context[config.OriginToken] = context.ogn
    context.tokens.unshift({
      id: config.OriginToken,
      type: 'OriginToken',
      name: 'Origin Token',
      symbol: 'OGN',
      decimals: '18',
      supply: '1000000000'
    })
  }
  try {
    const storedTokens = JSON.parse(window.localStorage[`${net}Tokens`])
    storedTokens.forEach(token => {
      if (context.tokens.find(t => t.id === token.id)) {
        return
      }
      context.tokens.push(token)
    })
  } catch (e) {
    /* Ignore */
  }

  context.tokens.forEach(token => {
    const contractDef =
      token.type === 'OriginToken' ? OriginTokenContract : TokenContract
    const contract = new web3.eth.Contract(contractDef.abi, token.id)
    token.contract = contract
    token.contractExec = contract
  })

  context.transactions = {}
  try {
    context.transactions = JSON.parse(window.localStorage[`${net}Transactions`])
  } catch (e) {
    /* Ignore */
  }

  if (metaMask) {
    context.metaMask = metaMask
    context.ognMM = new metaMask.eth.Contract(
      OriginTokenContract.abi,
      config.OriginToken
    )
    context.tokens.forEach(token => {
      token.contractMM = new metaMask.eth.Contract(
        token.contract.options.jsonInterface,
        token.contract.options.address
      )
    })
  }
  setMetaMask()
  setLinkerClient()
}

function setMetaMask() {
  if (metaMask && metaMaskEnabled) {
    context.metaMaskEnabled = true
    context.web3Exec = metaMask
    context.marketplaceExec = context.marketplaceMM
    context.ognExec = context.ognMM
    context.tokens.forEach(token => (token.contractExec = token.contractMM))
  } else {
    context.metaMaskEnabled = false
    context.web3Exec = web3
    context.marketplaceExec = context.marketplace
    context.ognExec = context.ogn
    context.tokens.forEach(token => (token.contractExec = token.contract))
  }
  if (context.messaging) {
    context.messaging.web3 = context.web3Exec
  }
}

function setLinkerClient() {
  if (window && window.isOriginAdmin) return
  if (!context.linker) return
  if (metaMask && metaMaskEnabled) return

  const linkerProvider = context.linker.getProvider()
  context.web3Exec = applyWeb3Hack(new Web3(linkerProvider))
  context.defaultLinkerAccount = '0x3f17f1962B36e491b30A40b2405849e597Ba5FB5'

  // TODO: fix token contracts
  context.marketplaceL = new context.web3Exec.eth.Contract(
    MarketplaceContract.abi,
    context.marketplace._address
  )
  if (context.messaging) {
    context.messaging.web3 = context.web3Exec
  }
  context.marketplaceExec = context.marketplaceL
}

export function toggleMetaMask(enabled) {
  metaMaskEnabled = enabled
  if (metaMaskEnabled) {
    window.localStorage.metaMaskEnabled = true
  } else {
    delete window.localStorage.metaMaskEnabled
  }
  setMetaMask()
}

export function setMarketplace(address, epoch) {
  context.marketplace = new web3.eth.Contract(MarketplaceContract.abi, address)
  context.marketplace.eventCache = eventCache(
    context.marketplace,
    epoch,
    context.web3,
    context.config
  )
  if (address) {
    context.marketplaces = [context.marketplace]
  } else {
    context.marketplaces = []
  }
  context.eventSource = new EventSource({
    marketplaceContract: context.marketplace,
    ipfsGateway: context.ipfsGateway,
    web3: context.web3
  })
  context.marketplaceExec = context.marketplace

  if (metaMask) {
    context.marketplaceMM = new metaMask.eth.Contract(
      MarketplaceContract.abi,
      address
    )
    if (metaMaskEnabled) {
      context.marketplaceExec = context.marketplaceMM
    }
  }
}

export function setIdentityEvents(address, epoch) {
  context.identityEvents = new web3.eth.Contract(
    IdentityEventsContract.abi,
    address
  )
  context.identityEvents.eventCache = genericEventCache(
    context.identityEvents,
    epoch,
    context.web3,
    context.config,
    context.config.IdentityEvents_EventCache
  )
  context.identityEventsExec = context.identityEvents

  if (metaMask) {
    context.identityEventsMM = new metaMask.eth.Contract(
      IdentityEventsContract.abi,
      context.identityEvents.options.address
    )
    if (metaMaskEnabled) {
      context.identityEventsExec = context.identityEventsMM
    }
  }
}

if (typeof window !== 'undefined') {
  if (window.ethereum) {
    metaMask = applyWeb3Hack(new Web3(window.ethereum))
    metaMaskEnabled = window.localStorage.metaMaskEnabled ? true : false
  }

  setNetwork(window.localStorage.ognNetwork || 'mainnet')

  window.context = context
}

export default context

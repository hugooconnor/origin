import React from 'react'
import { Query } from 'react-apollo'
import get from 'lodash/get'

import CanBuyQuery from 'queries/CanBuy'

function withCanTransact(WrappedComponent) {
  const WithCanTransact = props => {
    return (
      <Query query={CanBuyQuery}>
        {({ data, error, loading }) => {
          if (error) {
            return <WrappedComponent {...props} cannotTransact="load-error" />
          }
          if (loading) {
            return <WrappedComponent {...props} cannotTransact="loading" />
          }
          // TODO: remove this
          return <WrappedComponent {...props} />
          if (!get(data, 'web3.metaMaskAccount.id')) {
            return <WrappedComponent {...props} cannotTransact="no-wallet" />
          }
          if (get(data, 'web3.metaMaskAccount.balance.eth') === '0') {
            return <WrappedComponent {...props} cannotTransact="no-balance" />
          }

          const desiredNetwork = get(data, 'web3.networkId'),
            selectedNetwork = get(data, 'web3.metaMaskNetworkId')

          if (desiredNetwork !== selectedNetwork) {
            return (
              <WrappedComponent
                {...props}
                cannotTransact="wrong-network"
                cannotTransactData={get(data, 'web3.networkName')}
              />
            )
          }

          return <WrappedComponent {...props} />
        }}
      </Query>
    )
  }
  return WithCanTransact
}

export default withCanTransact

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import { ConnectWallet } from './components/ConnectWallet'
import { CreateProposal } from './components/CreateProposal'
import { ProposalList } from './components/ProposalList'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <header className="App-header">
            <h1>Minimal DAO - On-Chain Voting</h1>
            <ConnectWallet />
          </header>

          <main className="App-main">
            <section className="create-proposal-section">
              <h2>Create Proposal</h2>
              <CreateProposal />
            </section>

            <section className="proposals-section">
              <h2>Proposals</h2>
              <ProposalList />
            </section>
          </main>

          <footer className="App-footer">
            <p>Powered by Ethereum | Built with React + Wagmi + Viem</p>
          </footer>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

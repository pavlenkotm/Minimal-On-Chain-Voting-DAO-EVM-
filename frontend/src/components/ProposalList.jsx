import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, GOVERNOR_ABI } from '../contracts'
import { Proposal } from './Proposal'

export function ProposalList() {
  const { isConnected } = useAccount()
  const [proposals, setProposals] = useState([])

  // Read proposal count
  const { data: proposalCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESSES.governor,
    abi: GOVERNOR_ABI,
    functionName: 'proposalCount',
  })

  useEffect(() => {
    if (proposalCount) {
      const count = Number(proposalCount)
      const proposalIds = Array.from({ length: count }, (_, i) => i + 1)
      setProposals(proposalIds)
    }
  }, [proposalCount])

  // Refetch proposals every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCount()
    }, 10000)
    return () => clearInterval(interval)
  }, [refetchCount])

  if (!isConnected) {
    return (
      <div className="proposal-list">
        <p>Please connect your wallet to view proposals.</p>
      </div>
    )
  }

  if (!proposalCount || proposalCount === 0n) {
    return (
      <div className="proposal-list">
        <p>No proposals yet. Be the first to create one!</p>
      </div>
    )
  }

  return (
    <div className="proposal-list">
      {proposals.map((proposalId) => (
        <Proposal key={proposalId} proposalId={proposalId} />
      )).reverse()}
    </div>
  )
}

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, GOVERNOR_ABI } from '../contracts'
import { formatEther } from 'viem'

const PROPOSAL_STATES = ['Active', 'Succeeded', 'Defeated', 'Executed']

export function Proposal({ proposalId }) {
  const { address } = useAccount()

  // Read proposal data
  const { data: proposalData, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.governor,
    abi: GOVERNOR_ABI,
    functionName: 'getProposal',
    args: [BigInt(proposalId)],
  })

  // Check if user has voted
  const { data: hasVoted } = useReadContract({
    address: CONTRACT_ADDRESSES.governor,
    abi: GOVERNOR_ABI,
    functionName: 'hasVoted',
    args: [BigInt(proposalId), address],
  })

  // Vote transaction
  const { data: voteHash, writeContract: vote, isPending: isVoting } = useWriteContract()
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({
    hash: voteHash,
  })

  // Execute transaction
  const { data: executeHash, writeContract: executeProposal, isPending: isExecuting } = useWriteContract()
  const { isLoading: isExecuteConfirming, isSuccess: isExecuteSuccess } = useWaitForTransactionReceipt({
    hash: executeHash,
  })

  if (!proposalData) {
    return <div className="proposal loading">Loading proposal...</div>
  }

  const [id, description, forVotes, againstVotes, startTime, endTime, state] = proposalData

  const now = Math.floor(Date.now() / 1000)
  const isActive = now <= Number(endTime) && state === 0
  const hasEnded = now > Number(endTime)
  const totalVotes = forVotes + againstVotes
  const forPercentage = totalVotes > 0n ? Number((forVotes * 100n) / totalVotes) : 0
  const againstPercentage = totalVotes > 0n ? Number((againstVotes * 100n) / totalVotes) : 0

  const handleVote = async (support) => {
    try {
      await vote({
        address: CONTRACT_ADDRESSES.governor,
        abi: GOVERNOR_ABI,
        functionName: 'vote',
        args: [BigInt(proposalId), support],
      })
      setTimeout(() => refetch(), 2000)
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to vote. Check console for details.')
    }
  }

  const handleExecute = async () => {
    try {
      await executeProposal({
        address: CONTRACT_ADDRESSES.governor,
        abi: GOVERNOR_ABI,
        functionName: 'executeProposal',
        args: [BigInt(proposalId)],
      })
      setTimeout(() => refetch(), 2000)
    } catch (error) {
      console.error('Error executing proposal:', error)
      alert('Failed to execute proposal. Check console for details.')
    }
  }

  return (
    <div className={`proposal ${PROPOSAL_STATES[state].toLowerCase()}`}>
      <div className="proposal-header">
        <h3>Proposal #{proposalId.toString()}</h3>
        <span className={`status ${PROPOSAL_STATES[state].toLowerCase()}`}>
          {PROPOSAL_STATES[state]}
        </span>
      </div>

      <div className="proposal-description">
        <p>{description}</p>
      </div>

      <div className="proposal-stats">
        <div className="votes">
          <div className="vote-bar">
            <div className="for-bar" style={{ width: `${forPercentage}%` }} />
            <div className="against-bar" style={{ width: `${againstPercentage}%` }} />
          </div>
          <div className="vote-counts">
            <span className="for-votes">
              For: {formatEther(forVotes)} ({forPercentage}%)
            </span>
            <span className="against-votes">
              Against: {formatEther(againstVotes)} ({againstPercentage}%)
            </span>
          </div>
        </div>

        <div className="timing">
          <p>Ends: {new Date(Number(endTime) * 1000).toLocaleString()}</p>
        </div>
      </div>

      <div className="proposal-actions">
        {isActive && !hasVoted && (
          <div className="vote-buttons">
            <button
              onClick={() => handleVote(true)}
              disabled={isVoting || isVoteConfirming}
              className="vote-for"
            >
              Vote For
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isVoting || isVoteConfirming}
              className="vote-against"
            >
              Vote Against
            </button>
          </div>
        )}

        {hasVoted && isActive && (
          <p className="voted-message">You have already voted on this proposal.</p>
        )}

        {hasEnded && state === 0 && (
          <button
            onClick={handleExecute}
            disabled={isExecuting || isExecuteConfirming}
            className="execute-button"
          >
            {isExecuting || isExecuteConfirming ? 'Executing...' : 'Execute Proposal'}
          </button>
        )}

        {(isVoteSuccess || isExecuteSuccess) && (
          <p className="success-message">Transaction successful!</p>
        )}
      </div>
    </div>
  )
}

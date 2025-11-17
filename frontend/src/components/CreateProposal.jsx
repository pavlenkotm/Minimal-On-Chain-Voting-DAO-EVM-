import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES, GOVERNOR_ABI } from '../contracts'

export function CreateProposal() {
  const { address, isConnected } = useAccount()
  const [description, setDescription] = useState('')
  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      alert('Please enter a proposal description')
      return
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.governor,
        abi: GOVERNOR_ABI,
        functionName: 'createProposal',
        args: [description],
      })
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Failed to create proposal. Check console for details.')
    }
  }

  if (!isConnected) {
    return (
      <div className="create-proposal">
        <p>Please connect your wallet to create proposals.</p>
      </div>
    )
  }

  return (
    <div className="create-proposal">
      <form onSubmit={handleSubmit}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter your proposal description..."
          rows={4}
          disabled={isPending || isConfirming}
        />
        <button
          type="submit"
          disabled={isPending || isConfirming || !description.trim()}
        >
          {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Create Proposal'}
        </button>
      </form>
      {isSuccess && (
        <div className="success-message">
          Proposal created successfully! Transaction hash: {hash?.slice(0, 10)}...
        </div>
      )}
    </div>
  )
}

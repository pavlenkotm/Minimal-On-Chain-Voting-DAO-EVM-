// Update these addresses after deployment
export const CONTRACT_ADDRESSES = {
  token: '0x...',
  governor: '0x...',
  treasury: '0x...',
}

export const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
]

export const GOVERNOR_ABI = [
  'function proposalCount() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function createProposal(string description) returns (uint256)',
  'function vote(uint256 proposalId, bool support)',
  'function executeProposal(uint256 proposalId)',
  'function getProposal(uint256 proposalId) view returns (uint256 id, string description, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, uint8 state)',
  'function hasVoted(uint256 proposalId, address voter) view returns (bool)',
  'event ProposalCreated(uint256 indexed proposalId, string description, uint256 startTime, uint256 endTime)',
  'event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)',
]

export const TREASURY_ABI = [
  'function getBalance() view returns (uint256)',
  'function multisig() view returns (address)',
  'function executeProposal(uint256 proposalId)',
  'function withdraw(address payable to, uint256 amount)',
  'event FundsReceived(address indexed from, uint256 amount)',
  'event FundsWithdrawn(address indexed to, uint256 amount)',
]

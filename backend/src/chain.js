import { ethers } from 'ethers';

export function createChainWatcher({ rpcUrl, contractAddress, beneficiaryRegistryAddress, onStats }) {
  const DONATION_ABI = [
    'event Donation(address indexed donor, uint256 amount, bytes32 indexed beneficiaryId)',
    'event Disbursement(bytes32 indexed beneficiaryId, address indexed wallet, uint256 amount)',
    'function totalDonations() view returns (uint256)',
    'function totalDisbursed() view returns (uint256)',
    'function totalDonationCount() view returns (uint256)',
    'function uniqueDonorCount() view returns (uint256)'
  ];
  const BEN_ABI = [
    'event ClaimSubmitted(bytes32 indexed beneficiaryId, address indexed wallet, bytes32 disasterId, bytes32 docHash)',
    'event GovApproved(bytes32 indexed beneficiaryId, address indexed official)',
    'event JuryFinalized(bytes32 indexed beneficiaryId, bool approved)'
  ];

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, DONATION_ABI, provider);
  const benReg = beneficiaryRegistryAddress ? new ethers.Contract(beneficiaryRegistryAddress, BEN_ABI, provider) : null;

  async function refresh() {
    try {
      const [td, tb, tdc, udc] = await Promise.all([
        contract.totalDonations(),
        contract.totalDisbursed(),
        contract.totalDonationCount(),
        contract.uniqueDonorCount(),
      ]);
      onStats({
        totalDonations: BigInt(td.toString()),
        totalDisbursed: BigInt(tb.toString()),
        totalDonationCount: BigInt(tdc.toString()),
        uniqueDonorCount: BigInt(udc.toString()),
      });
    } catch {}
  }

  refresh();
  contract.on('Donation', refresh);
  contract.on('Disbursement', refresh);
  if (benReg) {
    benReg.on('ClaimSubmitted', refresh);
    benReg.on('GovApproved', refresh);
    benReg.on('JuryFinalized', refresh);
  }

  const interval = setInterval(refresh, 15000);
  return { stop() { contract.removeAllListeners(); clearInterval(interval); } };
}



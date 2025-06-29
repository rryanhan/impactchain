import React, { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { abi as impactChainAbi } from '../abi/ImpactChain.json';
import { abi as erc20Abi } from '../abi/ERC20Mock.json';

const USDC_DECIMALS = 18;
const USDC_ADDRESS = '0x038c064836784A78bAeF18f698B78d2ce5bD0134';

export default function DonationForm({ contractAddress, disabled }) {
  const { address: userAddress, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [txError, setTxError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { writeContract } = useWriteContract();

  // Read allowance from ERC20
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress, contractAddress],
    watch: true,
    query: { enabled: !!userAddress && !!contractAddress },
  });

  // Check if allowance is enough
  const isAllowanceEnough =
    allowance &&
    amount &&
    BigInt(allowance) >= parseUnits(amount, USDC_DECIMALS);

  // Reset approval/submission state when amount changes
  React.useEffect(() => {
    setIsApproved(false);
    setIsSubmitted(false);
    setTxHash(null);
    setTxError(null);
  }, [amount, contractAddress]);

  // Approve Token
  const handleApprove = async () => {
    setTxError(null);
    setIsApproving(true);
    try {
      await writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contractAddress, parseUnits(amount, USDC_DECIMALS)],
      });
      // Wait for allowance to update
      let tries = 0;
      while (tries < 20) {
        await refetchAllowance();
        const refreshed = await refetchAllowance();
        if (
          refreshed.data &&
          BigInt(refreshed.data) >= parseUnits(amount, USDC_DECIMALS)
        ) {
          setIsApproved(true);
          break;
        }
        await new Promise(res => setTimeout(res, 1000));
        tries++;
      }
    } catch (error) {
      setTxError(error.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Submit Payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTxError(null);
    setIsSubmitting(true);
    setTxHash(null);

    try {
      const txHash = await writeContract({
        address: contractAddress,
        abi: impactChainAbi,
        functionName: 'donate',
        args: [parseUnits(amount, USDC_DECIMALS)],
      });
      setTxHash(txHash);
      setIsSubmitted(true);
      setAmount('');
      await refetchAllowance();
    } catch (error) {
      setTxError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl p-8 flex items-center max-w-2xl mx-auto font-Montserrat">
      {/* Left Side: Input Area */}
      <div className="flex-1 flex flex-col items-start justify-center">
        <input
          id="donation-input"
          type="number"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full text-3xl font-bold text-gray-700 bg-white border border-gray-300 rounded-lg p-6 outline-none focus:ring-2 focus:ring-green-200 transition"
          placeholder="0 (USDC)"
          disabled={disabled || isApproving || isSubmitting}
          style={{ maxWidth: '16rem' }}
        />
      </div>

      {/* Right Side: Buttons */}
      <div className="flex flex-col items-stretch justify-center ml-10 space-y-4 w-48">
        <button
  type="button"
  onClick={handleApprove}
  disabled={!amount || disabled || isAllowanceEnough || isApproving || isSubmitting}
  className={`bg-gray-200 text-gray-500 font-semibold py-3 rounded-lg ${(!amount || disabled || isAllowanceEnough || isApproving || isSubmitting) ? 'cursor-not-allowed' : ''}`}
>
  {isAllowanceEnough
    ? "Token Approved"
    : isApproving
    ? "Approving..."
    : "Approve Token"}
</button>
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={!amount || disabled || !isAllowanceEnough || isSubmitting}
            className="w-full bg-[#a3d9a3] hover:bg-green-200 text-gray-800 font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {isSubmitted
              ? "Payment Submitted!"
              : isSubmitting
              ? "Submitting..."
              : "Submit Payment"}
          </button>
        </form>
        {txError && <div className="text-red-600 text-sm mt-2">{txError}</div>}
        {txHash && (
          <div className="text-green-600 mt-2 text-xs">
            Success! Tx: <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a>
          </div>
        )}
        {!isConnected && (
          <div className="text-red-600 text-xs mt-2">
            Please connect your wallet to donate.
          </div>
        )}
      </div>
    </section>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import ChainLink from './ChainLink';
import { createPublicClient, http, formatUnits } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { useWatchContractEvent } from 'wagmi';
import { abi as impactChainAbi } from '../abi/ImpactChain.json';

const ALCHEMY_URL = "https://polygon-amoy.g.alchemy.com/v2/Tg2TVQq3cC_Ih6oikD0VqfS5uXmJSLBR"

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleString();
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Dynamically find the deployment block
async function getDeploymentBlock(client, contractAddress) {
  const code = await client.getBytecode({ address: contractAddress });
  if (!code) throw new Error("Contract does not exist at this address.");

  let latestBlock = await client.getBlockNumber();
  let earliestBlock = 0n;
  let deploymentBlock = latestBlock;

  while (earliestBlock <= latestBlock) {
    const mid = (earliestBlock + latestBlock) / 2n;
    const codeAtMid = await client.getBytecode({ address: contractAddress, blockNumber: mid });
    if (codeAtMid) {
      deploymentBlock = mid;
      latestBlock = mid - 1n;
    } else {
      earliestBlock = mid + 1n;
    }
  }
  return deploymentBlock;
}

// Portal Tooltip component
function TooltipPortal({ children, show, anchorRef }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, [show, anchorRef]);
  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: coords.x,
        top: coords.y - 12,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="flex flex-col items-center"
    >
      {children}
      <div className="w-3 h-3 bg-gray-800 rotate-45 -mt-1.5"></div>
    </div>,
    document.body
  );
}

// Fetch recent Donated events using a chunking strategy to avoid RPC errors
async function fetchRecentDonations(contractAddress) {
  const client = createPublicClient({ chain: polygonAmoy, transport: http(ALCHEMY_URL) });
  try {
    const donatedEvent = impactChainAbi.find(item => item.type === 'event' && item.name === 'Donated');
    if (!donatedEvent) return [];

    // Dynamically get deployment block
    const deploymentBlock = await getDeploymentBlock(client, contractAddress);
    const latestBlock = await client.getBlockNumber();
    const allLogs = [];
    const chunkSize = 499n; 
    let fromBlock = deploymentBlock;

    console.log(`Fetching logs from deployment block ${deploymentBlock} to latest block ${latestBlock}`);

    while (fromBlock <= latestBlock) {
      const toBlock = fromBlock + chunkSize > latestBlock ? latestBlock : fromBlock + chunkSize;
      try {
        const logs = await client.getLogs({
          address: contractAddress,
          event: donatedEvent,
          fromBlock,
          toBlock,
        });
        console.log(`Fetched logs for chunk ${fromBlock}-${toBlock}:`, logs);
        allLogs.push(...logs);
      } catch (error) {
        console.error(`Error fetching logs for chunk ${fromBlock}-${toBlock}:`, error);
      }
      fromBlock = toBlock + 1n;
      await sleep(250);
    }
    
    console.log('All fetched logs:', allLogs);

    const parsed = allLogs.map(log => ({
      hash: log.transactionHash,
      donor: log.args.donor,
      amount: formatUnits(log.args.amount, 6),
      timestamp: log.args.timestamp,
    })).reverse();

    console.log('Parsed donations:', parsed);

    return parsed;

  } catch (error) {
    console.error("Error fetching recent donation logs:", error);
    return [];
  }
}

const DonationChain = ({ contractAddress }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState(null);
  const anchorRefs = useRef([]);

  useWatchContractEvent({
    address: contractAddress,
    abi: impactChainAbi,
    eventName: 'Donated',
    onLogs(logs) {
      console.log('New donation event received!', logs);
      const newDonation = {
        hash: logs[0].transactionHash,
        donor: logs[0].args.donor,
        amount: formatUnits(logs[0].args.amount, 6),
        timestamp: logs[0].args.timestamp,
      };
      setDonations(prevDonations => [newDonation, ...prevDonations]);
    },
  });

  useEffect(() => {
  if (!contractAddress) {
    setLoading(false);
    return;
  }
  setLoading(true);

  const cacheKey = `donations_${contractAddress}`;
  const cached = sessionStorage.getItem(cacheKey);

  let cachedDonations = [];
  if (cached) {
    try {
      cachedDonations = JSON.parse(cached);
      setDonations(cachedDonations);
      setLoading(false);
      console.log('[DonationChain] Loaded donations from cache:', cachedDonations);
      // Fetch in background to update
      fetchRecentDonations(contractAddress).then(data => {
        setDonations(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        console.log('[DonationChain] Updated donations from background fetch:', data);
      });
      return;
    } catch (e) {
      // Ignore parse errors and fetch fresh
      console.warn('[DonationChain] Cache parse error, fetching fresh:', e);
    }
  }

  fetchRecentDonations(contractAddress)
    .then(data => {
      setDonations(data);
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      console.log('[DonationChain] Donations fetched and cached:', data);
    })
    .catch(err => console.error('[DonationChain] Error fetching donations:', err))
    .finally(() => setLoading(false));
}, [contractAddress]);

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading recent donations...</div>;
  }

  if (!donations.length) {
    return <div className="text-gray-400 text-sm">Be the first to donate!</div>;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full" style={{ minHeight: '8rem' }}>
        <div className="relative w-full">
          <div className="flex items-start w-full space-x-0 overflow-x-auto pt-12 pb-4">
            {donations.map((tx, idx) => (
              <div
                key={`${tx.hash}-${idx}`}
                className="relative flex-shrink-0 -ml-3 first:ml-0"
                style={{ minWidth: 40 }}
                ref={el => (anchorRefs.current[idx] = el)}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <ChainLink
                  isFilled={true}
                  isFirst={idx === 0}
                  isLast={idx === donations.length - 1}
                />
                <TooltipPortal show={hoverIdx === idx} anchorRef={{ current: anchorRefs.current[idx] }}>
                  <div className="bg-gray-800 text-white rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-auto">
                    <div className="font-bold">{tx.amount} USDC</div>
                    <div className="text-gray-300">
                      by {tx.donor.slice(0, 6)}...{tx.donor.slice(-4)}
                    </div>
                    <div className="text-gray-400 text-xs">{formatTime(tx.timestamp)}</div>
                  </div>
                </TooltipPortal>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600">
        Showing {donations.length} most recent donation{donations.length !== 1 ? 's' : ''}.
      </div>
    </div>
  );
};

export default DonationChain;
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Address } from "../components/scaffold-eth";
import deployedContracts from "../contracts/deployedContracts";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { AnimatePresence, motion } from "framer-motion";
import styled, { keyframes } from "styled-components";
import { useAccount } from "wagmi";

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

// ---------- Types ----------
type Memo = {
  name: string;
  message: string;
  timestamp: string | number;
  from: string;
  amount: string | null;
};

const CHAIN_ID_HEX = "0xaa36a7"; // Sepolia chainId in hex

// ---------- Keyframes for Floating/Bobbing Animation ----------
const floatKeyframes = keyframes`
  0%   { transform: translateY(-50%); }
  50%  { transform: translateY(-60%); }
  100% { transform: translateY(-50%); }
`;

// ---------- Styled Component for Desktop Cards ----------
const DesktopCard = styled(motion.div)`
  position: absolute;
  width: 200px;
  height: 260px;
  cursor: pointer;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  transform-style: preserve-3d;
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;
  animation: ${floatKeyframes} 3s ease-in-out infinite;

  &:hover {
    transform: perspective(400px) rotateX(10deg) rotateY(-5deg) translate(-50%, -55%);
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .card-message {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  .card-amount {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  .card-time {
    font-size: 0.8rem;
    color: #777;
    margin-bottom: 4px;
  }
  .card-from {
    font-size: 0.8rem;
    color: #777;
  }

  @media (max-width: 768px) {
    width: 180px;
    height: 240px;
  }
`;

// ---------- Styled Component for Mobile Cards Grid ----------
const MobileCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
`;

// ---------- Modal Styled Components ----------
const ModalBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled(motion.div)`
  background: #fff;
  color: #333;
  width: 320px;
  min-height: 380px;
  border-radius: 15px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  position: relative;

  .closeBtn {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.8;
    &:hover {
      opacity: 1;
    }
  }
  .modal-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .modal-subtitle {
    font-size: 15px;
    margin-bottom: 10px;
    color: #555;
  }
  .modal-amount,
  .modal-time,
  .modal-from {
    font-size: 14px;
    margin-bottom: 8px;
    color: #666;
  }
`;

// ---------- Main Page Component ----------
export default function Home() {
  // ---------- Contract & MetaMask State ----------
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [totalDonations, setTotalDonations] = useState("0");
  const [globalMessage, setGlobalMessage] = useState("");

  const { address: connectedAddress } = useAccount();

  // ---------- Memos State ----------
  const [memos, setMemos] = useState<Memo[]>([]);

  // ---------- UI State for Donation Form ----------
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);
  const [donationName, setDonationName] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [donationAmount, setDonationAmount] = useState("0.001");

  // ---------- Modal State for Full-View Card ----------
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  // ---------- Transaction Receipt State ----------
  const [transactionReceipt, setTransactionReceipt] = useState<any>(null);

  // ---------- Scroll State ----------
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  // Reference to donation section for smooth scrolling
  const donationSectionRef = useRef<HTMLDivElement>(null);

  // ---------- Determine if Mobile Layout ----------
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------- Setup on Mount ----------
  useEffect(() => {
    async function setup() {
      if (!window.ethereum) {
        setGlobalMessage("MetaMask is not installed.");
        return;
      }
      const newProvider = new BrowserProvider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []);

      const network = await newProvider.getNetwork();
      const currentChainId = network.chainId;
      const expectedChainId = parseInt(CHAIN_ID_HEX, 16);
      if (currentChainId !== BigInt(expectedChainId)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: CHAIN_ID_HEX }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: CHAIN_ID_HEX,
                  chainName: "Sepolia Testnet",
                  rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/qT9FB7rsVoVAAVP68ZrZzBh_scV5hHDc"],
                  nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      const newSigner = await newProvider.getSigner();
      const contractAddress =
        deployedContracts["11155111"]?.BuyMeACoffee?.address || "0x2F3B3bC31FEc78A4378E6ff18B8F9F50667d45df";
      const contractAbi = deployedContracts["11155111"]?.BuyMeACoffee?.abi;
      const newContract = new Contract(contractAddress, contractAbi, newSigner);

      const addr = await newSigner.getAddress();
      const bal = await newProvider.getBalance(addr);

      setProvider(newProvider);
      setContract(newContract);
      setUserAddress(addr);
      setBalance(formatEther(bal));
      setGlobalMessage("");

      // Fetch total donations
      const total = await newContract.totalDonations();
      setTotalDonations(formatEther(total));

      // Fetch memos (for real‑time updates, you may add event listeners)
      const memosData = await newContract.getMemos();
      setMemos(memosData);
    }
    setup().catch(err => setGlobalMessage(err.message));
  }, []);

  //  For real‑time updates, you might add a listener:
  useEffect(() => {
    if (contract) {
      contract.on("NewMemo", (name, message, timestamp, from, amount) => {
        setMemos(prev => [...prev, { name, message, timestamp, from, amount }]);
      });
    }
    return () => {
      if (contract) {
        contract.removeAllListeners("NewMemo");
      }
    };
  }, [contract]);

  // ---------- Scroll Event Listener ----------
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledDown(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------- Download Receipt Function ----------
  const downloadReceipt = () => {
    if (!transactionReceipt) return;
    const receiptData = JSON.stringify(transactionReceipt, null, 2);
    const blob = new Blob([receiptData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaction-receipt-${transactionReceipt.transactionHash}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ---------- Donation Handler ----------
  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) {
      setDonationError("Contract is not loaded.");
      return;
    }
    setDonationError(null);
    setDonationSuccess(null);

    try {
      const tx = await contract.buyCoffee(donationName, donationMessage, {
        value: parseEther(donationAmount),
      });
      const receipt = await tx.wait();
      setTransactionReceipt(receipt);
      setDonationSuccess("Thank you for believing in us.Together, we can create something amazing!");
      setDonationName("");
      setDonationMessage("");
      setDonationAmount("0.001");

      // Refresh totals & memos
      const updatedTotal = await contract.totalDonations();
      setTotalDonations(formatEther(updatedTotal));
      const updatedMemos = await contract.getMemos();
      setMemos(updatedMemos);
    } catch (error: any) {
      setDonationError(`Transaction failed: ${error.message}`);
    }
  };

  // ---------- Sorted Memos (Top 6 by donation amount) ----------
  const sortedMemos = [...memos].sort((a, b) => parseFloat(b.amount || "0") - parseFloat(a.amount || "0"));
  const topMemos = sortedMemos.slice(0, 6);

  // ---------- Compute Card Positions for Desktop (3 left, 3 right) ----------
  const leftPositions = [
    { top: "40%", left: "10%" },
    { top: "60%", left: "5%" },
    { top: "80%", left: "10%" },
  ];
  const rightPositions = [
    { top: "40%", right: "10%" },
    { top: "60%", right: "5%" },
    { top: "80%", right: "10%" },
  ];
  const cardPositionsDesktop = topMemos.map((_, index) =>
    index < 3 ? leftPositions[index] : rightPositions[index - 3],
  );

  // ---------- Modal Handlers ----------
  const handleCardClick = (memo: Memo) => {
    setSelectedMemo(memo);
  };
  const closeModal = () => setSelectedMemo(null);

  return (
    <>
      {/* Updated gradient background to sky-themed */}
      <div className="relative min-h-screen bg-gradient-to-b from-sky-400 via-sky-200 to-white flex flex-col overflow-visible">
        {/* Subtle radial spotlight overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_70%)]" />

        {/* Hero / Landing Section */}
        <section className="relative w-full py-16 text-center overflow-visible">
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <div className="flex justify-center items-center mb-3">
              <span className="text-yellow-500 text-xl mr-2">★★★★★</span>
              <p className="text-gray-700 font-semibold">Loved by 1,000+ creators</p>
            </div>
            <div
              className="mx-auto mb-4"
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "transparent", // Transparent background
              }}
            ></div>
            <h1 className="text-5xl font-bold mb-4">Be Part of Our Story</h1>
            <p className="text-xl mb-8 text-gray-700">
              Join a vibrant community of visionaries and supporters who are transforming ideas into reality.
            </p>
            {/* Updated button styling to match the sky theme */}
            <button
              onClick={() => donationSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="bg-sky-500 text-white px-6 py-3 rounded-full text-lg font-semibold 
                         hover:bg-sky-600 transition-colors duration-300"
            >
              Donate Now
            </button>
          </div>

          {/* Floating Cards */}
          {isMobile ? (
            <div className="relative w-full mt-8">
              <div className="max-w-5xl mx-auto px-4">
                <MobileCardsGrid>
                  {topMemos.map((memo, index) => (
                    <motion.div
                      key={index}
                      className="bg-transparent text-left rounded-xl shadow-xl p-4 hover:shadow-2xl cursor-pointer"
                      whileHover={{
                        scale: 1.05,
                        rotateX: 10,
                        rotateY: -5,
                        y: -15,
                      }}
                      transition={{ type: "spring", stiffness: 70 }}
                      onClick={() => handleCardClick(memo)}
                    >
                      <h3 className="font-bold text-md mb-1">{memo.name || "Anonymous"}</h3>
                      <p className="text-gray-600 text-sm mb-1">Msg: {memo.message}</p>
                      <p className="text-gray-600 text-sm mb-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faEthereum} />
                        {Number(formatEther(memo.amount || "0")).toFixed(6)} ETH
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(Number(memo.timestamp) * 1000).toLocaleString()}
                      </p>
                      <div className="mt-1 text-xs text-gray-500">
                        From: <Address address={memo.from} />
                      </div>
                    </motion.div>
                  ))}
                </MobileCardsGrid>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
              <div className="relative w-full h-[700px] overflow-visible">
                {topMemos.map((memo, index) => {
                  const stylePos = cardPositionsDesktop[index] || {};
                  return (
                    <DesktopCard
                      key={index}
                      style={stylePos}
                      animate={{
                        x: isScrolledDown && index < 3 ? "-100px" : isScrolledDown && index >= 3 ? "100px" : "0px",
                        opacity: isScrolledDown ? 0 : 1,
                      }}
                      transition={{ duration: 0.5 }}
                      whileHover={{
                        scale: 1.05,
                        rotateX: 10,
                        rotateY: -5,
                        y: -15,
                      }}
                      onClick={() => handleCardClick(memo)}
                    >
                      <div className="card-title">{memo.name || "Anonymous"}</div>
                      <div className="card-message">Msg: {memo.message}</div>
                      <div className="card-amount flex items-center gap-1">
                        <FontAwesomeIcon icon={faEthereum} />
                        {Number(formatEther(memo.amount || "0")).toFixed(6)} ETH
                      </div>
                      <div className="card-time">{new Date(Number(memo.timestamp) * 1000).toLocaleString()}</div>
                      <div className="card-from">
                        From: <Address address={memo.from} />
                      </div>
                    </DesktopCard>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Donation Section */}
        <section ref={donationSectionRef} className="w-full py-12 text-center relative z-10 ">
          <div
            className="max-w-lg mx-auto 
                       bg-white bg-opacity-10 backdrop-blur-xl 
                       p-6 rounded-md shadow-md 
                       transition transform duration-500 hover:scale-105"
          >
            <h2 className="text-2xl font-bold mb-4 text-black">Inspire New Creations:</h2>
            <p className="text-black-300 mb-6">
              Your support directly fuels our creative projects and helps us explore new ideas.
            </p>

            {/* Connected Address & Stats */}
            <div className="my-4 text-left bg-gray-800 bg-opacity-70 p-4 rounded-md shadow-sm mb-6">
              <p className="font-medium text-white">Connected Address:</p>
              <Address address={connectedAddress || userAddress} />
              <p className="text-white">Balance: {balance} ETH</p>
              <p className="text-white">Total Donations: {totalDonations} ETH</p>
            </div>

            {/* Donation Form */}
            <form onSubmit={handleDonate} className="space-y-4">
              {donationError && <div className="text-red-400 text-sm">{donationError}</div>}
              {donationSuccess && (
                <div className="text-green-400 text-sm">
                  {donationSuccess}
                  {transactionReceipt && (
                    <div className="mt-2">
                      <a
                        href={`https://sepolia.etherscan.io/address/${connectedAddress || userAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline mr-4"
                      >
                        View on Etherscan
                      </a>
                      <button type="button" onClick={downloadReceipt} className="text-blue-400 underline">
                        Download Receipt
                      </button>
                    </div>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-4 py-2 rounded-full border border-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={donationName}
                onChange={e => setDonationName(e.target.value)}
                required
              />

              <textarea
                placeholder="Message"
                className="w-full px-4 py-2 rounded-md border border-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={donationMessage}
                onChange={e => setDonationMessage(e.target.value)}
              />

              <input
                type="number"
                placeholder="0.001"
                className="w-full px-4 py-2 rounded-full border border-gray-300 
                           focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={donationAmount}
                onChange={e => setDonationAmount(e.target.value)}
                required
              />

              {/* Updated button styling to sky theme */}
              <button
                type="submit"
                className="bg-sky-500 text-white px-6 py-3 rounded-full text-lg font-semibold w-full 
                           hover:bg-sky-600 transition-colors duration-300"
              >
                Donate
              </button>
            </form>
          </div>
        </section>

        {/* Global Message */}
        {globalMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 p-3 rounded-md shadow-md">
            {globalMessage}
          </div>
        )}
      </div>
    </>
  );
}

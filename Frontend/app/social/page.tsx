"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Users,
  Award,
  CheckCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Search
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import {
  userProfile,
  socialNetwork,
  endorsements as initialEndorsements,
  guarantors as initialGuarantors,
  daoMemberships,
  leaderboard
} from "@/lib/mock-data";
import { useWallet } from "@/context/WalletContext";
import { useUser, useEndorsements, useGuarantors, useLeaderboard } from "@/hooks/useApi";

export default function SocialTrustPage() {
  const { walletAddress } = useWallet();
  const { user: liveUser } = useUser(walletAddress);
  const { endorsements: liveEndorsements, addEndorsement } = useEndorsements(walletAddress);
  const { guarantors: liveGuarantors, addGuarantor } = useGuarantors(walletAddress);
  const { leaderboard: liveLeaderboard } = useLeaderboard();

  const [endorsements, setEndorsements] = useState<any[]>(initialEndorsements);
  const [guarantors, setGuarantors] = useState<any[]>(initialGuarantors);

  useEffect(() => {
    if (liveEndorsements && liveEndorsements.length > 0) {
      setEndorsements(liveEndorsements);
    }
  }, [liveEndorsements]);

  useEffect(() => {
    if (liveGuarantors && liveGuarantors.length > 0) {
      setGuarantors(liveGuarantors);
    }
  }, [liveGuarantors]);
  
  // Modals state
  const [isEndorsementModalOpen, setIsEndorsementModalOpen] = useState(false);
  const [isGuarantorModalOpen, setIsGuarantorModalOpen] = useState(false);

  // Form states
  const [endorsementName, setEndorsementName] = useState("");
  const [endorsementComment, setEndorsementComment] = useState("");
  
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorWallet, setGuarantorWallet] = useState("");
  const [guarantorAmount, setGuarantorAmount] = useState(5000);

  // SVG Hover Node State
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);

  // Handle Endorsement Submit
  const handleEndorsementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorsementName) return;

    if (liveUser) {
      addEndorsement({
        name: endorsementName,
        comment: endorsementComment || "Vouched for creditworthiness and stellar identity logs.",
        score: Math.floor(700 + Math.random() * 200)
      }).then(() => {
        setIsEndorsementModalOpen(false);
        setEndorsementName("");
        setEndorsementComment("");
        alert(`Endorsement request sent to ${endorsementName}! Dynamic score update pending validator review.`);
      }).catch((err) => {
        alert("Failed to submit endorsement: " + err.message);
      });
    } else {
      const newEndorsement = {
        id: `END-${Math.floor(1000 + Math.random() * 9000)}`,
        name: endorsementName,
        score: Math.floor(700 + Math.random() * 200),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        impact: `+${Math.floor(3 + Math.random() * 5)} pts`,
        comment: endorsementComment || "Vouched for creditworthiness and stellar identity logs.",
      };

      setEndorsements([newEndorsement, ...endorsements]);
      setIsEndorsementModalOpen(false);
      setEndorsementName("");
      setEndorsementComment("");
      alert(`Endorsement request sent to ${endorsementName}! Dynamic score update pending validator review.`);
    }
  };

  // Handle Guarantor Submit
  const handleGuarantorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guarantorName || !guarantorWallet) return;

    if (liveUser) {
      addGuarantor({
        name: guarantorName,
        wallet: guarantorWallet,
        amount: guarantorAmount
      }).then(() => {
        setIsGuarantorModalOpen(false);
        setGuarantorName("");
        setGuarantorWallet("");
        alert(`${guarantorName} successfully linked as a loan guarantor for ₹${guarantorAmount.toLocaleString()}.`);
      }).catch((err) => {
        alert("Failed to link guarantor: " + err.message);
      });
    } else {
      const newGuarantor = {
        id: `GUR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: guarantorName,
        wallet: guarantorWallet.length > 12 ? `${guarantorWallet.slice(0, 6)}...${guarantorWallet.slice(-4)}` : guarantorWallet,
        amount: `₹${guarantorAmount.toLocaleString()}`,
        status: "Active"
      };

      setGuarantors([newGuarantor, ...guarantors]);
      setIsGuarantorModalOpen(false);
      setGuarantorName("");
      setGuarantorWallet("");
      alert(`${guarantorName} successfully linked as a loan guarantor for ₹${guarantorAmount.toLocaleString()}.`);
    }
  };

  const displayLeaderboard = liveLeaderboard && liveLeaderboard.length > 0
    ? liveLeaderboard.map((u: any) => ({ ...u, isCurrent: u.walletAddress === walletAddress }))
    : leaderboard;

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      <main className="flex-1 pl-16 xl:pl-60 min-h-screen flex flex-col transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-borderCustom px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">Social Trust Network</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· Peer endorsements and DAO associations</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-borderCustom bg-slate-50 rounded-xl font-mono text-xs text-text-secondary select-none">
              <Wallet className="w-3.5 h-3.5 text-text-muted" />
              <span>{truncateWallet(walletAddress || userProfile.walletAddress)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-mono text-sm font-semibold">
              AS
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Trust Network Graph Visualizer */}
          <section className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">Your Trust Network Graph</h2>
                <p className="text-xs text-text-muted mt-0.5">Interactive map of peer nodes, endorsements, and validator channels.</p>
              </div>
              <Tooltip content="Hover over nodes to inspect relationship metrics. Node diameters scale with credit score sizes. Edge weights correspond to stake capacities.">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted border border-borderCustom hover:bg-slate-50">
                  <Info className="w-3.5 h-3.5" />
                </div>
              </Tooltip>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full bg-slate-50 rounded-xl border border-borderCustom p-4 flex items-center justify-center relative overflow-hidden min-h-[360px]">
              <svg className="w-full max-w-[650px] h-[340px]" viewBox="0 0 500 360">
                {/* Connections (Edges) */}
                {socialNetwork.edges.map((edge, idx) => {
                  const srcNode = socialNetwork.nodes.find(n => n.id === edge.source);
                  const tarNode = socialNetwork.nodes.find(n => n.id === edge.target);
                  if (!srcNode || !tarNode) return null;
                  return (
                    <line
                      key={idx}
                      x1={srcNode.x}
                      y1={srcNode.y}
                      x2={tarNode.x}
                      y2={tarNode.y}
                      stroke="#E2E8F0"
                      strokeWidth={edge.weight}
                      className="transition-all hover:stroke-primary/40 duration-200"
                    />
                  );
                })}

                {/* Nodes */}
                {socialNetwork.nodes.map((node) => {
                  const isYou = node.role === "you";
                  const isDao = node.role === "dao";
                  const nodeSize = isYou ? 28 : isDao ? 22 : 18;

                  let nodeColor = "fill-accent"; // Low Risk
                  if (isYou) nodeColor = "fill-primary";
                  else if (node.score < 700) nodeColor = "fill-amber-500";
                  else if (isDao) nodeColor = "fill-violet-600";

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Outer pulse for You */}
                      {isYou && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={nodeSize + 6}
                          className="fill-primary/10 stroke-primary/20 animate-ping"
                          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                        />
                      )}
                      
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeSize}
                        className={`${nodeColor} stroke-white`}
                        strokeWidth="3.5"
                      />
                      
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="white"
                        className="font-sans text-[8px] sm:text-[9px] font-bold pointer-events-none"
                      >
                        {isYou ? "YOU" : node.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Float Hover Card */}
              {hoveredNode && (
                <div
                  className="absolute bg-white border border-cardBorder rounded-xl p-3 shadow-lg z-25 w-48 font-sans text-xs space-y-1.5 transition-all pointer-events-none"
                  style={{
                    left: `${Math.min(hoveredNode.x + 30, 300)}px`,
                    top: `${Math.min(hoveredNode.y - 40, 220)}px`,
                  }}
                >
                  <p className="font-bold text-text-primary">{hoveredNode.name}</p>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Trust Score:</span>
                    <span className="font-mono font-bold text-primary">{hoveredNode.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Type:</span>
                    <span className="font-semibold text-text-muted capitalize">{hoveredNode.role}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-success font-semibold">
                    <span>Stellar identity linked</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Map Legends */}
              <div className="absolute bottom-4 left-6 flex items-center gap-4 text-[9px] font-mono text-text-muted uppercase tracking-wider">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> You</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Peers (Score 750+)</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Peers (Score &lt;700)</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-600" /> DAOs</div>
              </div>
            </div>
          </section>

          {/* Endorsements & Guarantors Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Endorsements Received (Left) */}
            <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Endorsements Received</h3>
                <button
                  onClick={() => setIsEndorsementModalOpen(true)}
                  className="px-3.5 py-2 border-2 border-primary text-primary hover:bg-primary-light font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Endorsement</span>
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {endorsements.map((end) => (
                  <div key={end.id} className="bg-white border border-cardBorder rounded-xl p-4.5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                          {end.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{end.name}</p>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">Score: {end.score}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-success border-emerald-100">
                        {end.impact} Impact
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-normal italic pl-2 border-l-2 border-primary/20">
                      &ldquo;{end.comment}&rdquo;
                    </p>
                    <div className="text-[10px] text-text-muted text-right font-medium">
                      Received {end.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantors Panel (Right) */}
            <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Guarantors</h3>
                <button
                  onClick={() => setIsGuarantorModalOpen(true)}
                  className="px-3.5 py-2 border-2 border-primary text-primary hover:bg-primary-light font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Guarantor</span>
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {guarantors.map((gur) => (
                  <div key={gur.id} className="bg-white border border-cardBorder rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-xs font-bold text-text-primary">{gur.name}</p>
                        <p className="text-[10px] font-mono text-text-muted mt-0.5">Wallet: {gur.wallet}</p>
                      </div>
                      <span className="px-2 py-0.5 border bg-blue-50 text-primary border-blue-100 text-[10px] font-bold rounded-full">
                        {gur.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
                      <span>Covering Capacity:</span>
                      <span className="font-mono text-text-primary font-bold text-sm">{gur.amount}</span>
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      This guarantor will cushion up to {gur.amount} in default risk, decreasing your borrow interest rates by 1.5% APY.
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* DAO Memberships Horizontal Scroll */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">DAO & Club Memberships</h3>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {daoMemberships.map((dao) => (
                <div key={dao.id} className="min-w-[280px] bg-white border border-cardBorder rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{dao.name}</h4>
                      <span className="text-[9px] font-mono text-text-muted mt-0.5">Members: {dao.members}</span>
                    </div>
                    <Award className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex justify-between items-center text-xs font-medium text-text-secondary border-t border-slate-50 pt-3">
                    <span>Trust score weight:</span>
                    <span className="font-mono font-bold text-accent">+{dao.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Community Leaderboard */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Community Leaderboard</h3>
            <DataTable headers={["Rank", "User", "Trust Score", "Trend"]}>
              {displayLeaderboard.map((user: any) => (
                <tr
                  key={user.rank}
                  className={`border-b border-borderCustom hover:bg-slate-50/50 transition-colors ${
                    user.isCurrent ? "bg-primary-light/50 border-l-2 border-accent" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 text-xs font-mono font-bold text-text-secondary">
                    {user.rank}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-text-secondary border border-borderCustom">
                        {user.avatar}
                      </div>
                      <span className={`text-xs font-semibold ${user.isCurrent ? "text-primary font-bold" : "text-text-primary"}`}>
                        {user.name} {user.isCurrent && " (You)"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm font-mono font-bold text-text-primary">
                    {user.score}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                      user.trend === "up" ? "text-success" : user.trend === "down" ? "text-danger" : "text-text-muted"
                    }`}>
                      {user.trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : user.trend === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>

        </div>

      </main>

      {/* Request Endorsement Modal */}
      <Modal isOpen={isEndorsementModalOpen} onClose={() => setIsEndorsementModalOpen(false)} title="Request Peer Endorsement">
        <form onSubmit={handleEndorsementSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="endorsement-name-input">Peer Name</label>
            <input
              id="endorsement-name-input"
              type="text"
              required
              placeholder="e.g. Priya Patel"
              value={endorsementName}
              onChange={(e) => setEndorsementName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="endorsement-comment-input">Endorsement Note</label>
            <textarea
              id="endorsement-comment-input"
              placeholder="Provide context about your creditworthiness..."
              value={endorsementComment}
              onChange={(e) => setEndorsementComment(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEndorsementModalOpen(false)}
              className="flex-1 py-2.5 border border-borderCustom hover:bg-slate-50 text-text-secondary text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow"
            >
              Request Vouch
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Guarantor Modal */}
      <Modal isOpen={isGuarantorModalOpen} onClose={() => setIsGuarantorModalOpen(false)} title="Link Loan Guarantor">
        <form onSubmit={handleGuarantorSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="guarantor-name-input">Guarantor Name</label>
            <input
              id="guarantor-name-input"
              type="text"
              required
              placeholder="e.g. Rohan Das"
              value={guarantorName}
              onChange={(e) => setGuarantorName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="guarantor-wallet-input">Stellar Wallet Address</label>
            <input
              id="guarantor-wallet-input"
              type="text"
              required
              placeholder="GB837A..."
              value={guarantorWallet}
              onChange={(e) => setGuarantorWallet(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Risk Coverage (INR)</label>
            <div className="flex items-center justify-between text-xs mb-1 font-mono font-bold text-primary">
              <span>₹{guarantorAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={guarantorAmount}
              onChange={(e) => setGuarantorAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsGuarantorModalOpen(false)}
              className="flex-1 py-2.5 border border-borderCustom hover:bg-slate-50 text-text-secondary text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow"
            >
              Link Guarantor
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

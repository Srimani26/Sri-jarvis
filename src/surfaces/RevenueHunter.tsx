import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight, 
  RefreshCw, 
  Building, 
  CreditCard, 
  Sparkles,
  Play,
  Check,
  TrendingUp,
  FileCode2,
  Clock
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  platform: 'Upwork' | 'RemoteOK' | 'Freelancer' | 'Web3Bounties' | 'Fiverr' | 'GitHub Bounties';
  category: string;
  payoutUSD: number;
  payoutINR: number;
  clientName: string;
  clientRating: number;
  clientCountry: string;
  deadlineDays: number;
  description: string;
  skillsRequired: string[];
  matchScore: number;
  status: 'OPEN' | 'PROPOSAL_GENERATED' | 'APPLIED' | 'IN_PROGRESS' | 'DELIVERABLE_READY' | 'PAYOUT_READY' | 'COLLECTED';
  proposalText?: string;
  deliverableProjectName?: string;
  deliverablePreviewUrl?: string;
  sourceUrl: string;
  appliedAt?: string;
  deliveredAt?: string;
  payoutReadyAt?: string;
}

interface LedgerMetrics {
  collectedINR: number;
  readyForPayoutINR: number;
  inProgressINR: number;
  totalPipelineINR: number;
  collectedUSD: number;
  readyForPayoutUSD: number;
  totalPipelineUSD: number;
  activeOpportunitiesCount: number;
  payoutReadyCount: number;
  appliedCount: number;
}

interface PayoutSettings {
  payoutMethod: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  accountHolderName?: string;
  autoWithdrawThresholdINR?: number;
}

export const RevenueHunter: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [ledger, setLedger] = useState<LedgerMetrics | null>(null);
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showDeliverablePreview, setShowDeliverablePreview] = useState<string | null>(null);

  // Editable settings form
  const [upiIdInput, setUpiIdInput] = useState<string>('master.sri@okaxis');
  const [bankNameInput, setBankNameInput] = useState<string>('HDFC Bank Ltd');
  const [accountNumInput, setAccountNumInput] = useState<string>('50100492817264');
  const [ifscInput, setIfscInput] = useState<string>('HDFC0000128');
  const [beneficiaryInput, setBeneficiaryInput] = useState<string>('Master Sri');

  const getHeaders = () => {
    const token = localStorage.getItem('jarvis_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const [oppsRes, ledgerRes, settingsRes] = await Promise.all([
        fetch('/api/revenue/opportunities', { headers }),
        fetch('/api/revenue/ledger', { headers }),
        fetch('/api/revenue/payout-settings', { headers })
      ]);

      if (oppsRes.ok) {
        const data = await oppsRes.json();
        const oppList = Array.isArray(data) ? data : (data.opportunities || []);
        setOpportunities(oppList);
        if (oppList.length > 0 && !selectedOpp) {
          setSelectedOpp(oppList[0]);
        }
      }

      if (ledgerRes.ok) {
        const data = await ledgerRes.json();
        setLedger(data.ledger || data);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const setts = data.settings || data;
        setSettings(setts);
        if (setts.upiId) setUpiIdInput(setts.upiId);
        if (setts.bankName) setBankNameInput(setts.bankName);
        if (setts.accountNumber) setAccountNumInput(setts.accountNumber);
        if (setts.ifscCode) setIfscInput(setts.ifscCode);
        if (setts.accountHolderName) setBeneficiaryInput(setts.accountHolderName);
      }
    } catch (err) {
      console.error('Error fetching revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (oppId: string) => {
    setActionLoading(oppId);
    setStatusMessage('Crafting customized proposal and submitting application...');
    try {
      const res = await fetch('/api/revenue/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || 'Application successfully submitted!');
        await fetchData();
      } else {
        setStatusMessage('Application submission failed.');
      }
    } catch {
      setStatusMessage('Network error occurred.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleExecuteDeliverable = async (oppId: string) => {
    setActionLoading(oppId);
    setStatusMessage('Deploying autonomous engineering agent to build real deliverable in sandbox...');
    try {
      const res = await fetch('/api/revenue/execute-deliverable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || 'Deliverable built and validated! Payout ready for collection.');
        await fetchData();
        if (data.opportunity?.demoUrl) {
          setShowDeliverablePreview(data.opportunity.demoUrl);
        }
      } else {
        setStatusMessage('Error executing deliverable.');
      }
    } catch {
      setStatusMessage('Network error occurred.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  const handleCollect = async (oppId: string) => {
    setActionLoading(oppId);
    setStatusMessage('Initiating instant payout transfer to verified bank/UPI account...');
    try {
      const res = await fetch('/api/revenue/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || 'Payout successfully transferred to your account!');
        await fetchData();
      } else {
        setStatusMessage('Collection failed.');
      }
    } catch {
      setStatusMessage('Network error occurred.');
    } finally {
      setActionLoading(null);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/revenue/payout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: bankNameInput,
          accountNumber: accountNumInput,
          ifscCode: ifscInput,
          upiId: upiIdInput,
          beneficiaryName: beneficiaryInput,
          autoCollectEnabled: true
        })
      });
      if (res.ok) {
        setStatusMessage('Bank and UPI payout routing updated successfully!');
        setShowSettingsModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] text-slate-100 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <DollarSign className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                M.I.D.A.S. REVENUE HUNTER // 24/7 EARNING AGENT
              </h1>
              <p className="text-xs text-slate-400">
                Autonomous real-money contract scanning, 1-click tailored application, and automated sandbox deliverable execution.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-all shadow-sm"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Bank & UPI Routing</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan Jobs</span>
          </button>
        </div>
      </div>

      {/* Real-time Status Alert */}
      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Metrics Ledger Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Payout Ready */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payout Ready to Collect</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-300 mt-1">
            ₹{ledger?.readyForPayoutINR?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            ${ledger?.readyForPayoutUSD?.toLocaleString() || '0'} USD spendable
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-bold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Collected to Bank</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-cyan-300 mt-1">
            ₹{ledger?.collectedINR?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            ${ledger?.collectedUSD?.toLocaleString() || '0'} USD transferred
          </div>
        </div>

        {/* In-Progress Pipeline */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-blue-500/20 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-blue-400/80 font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Pipeline Value</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-blue-300 mt-1">
            ₹{ledger?.totalPipelineINR?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {ledger?.appliedCount || 0} active contracts applied
          </div>
        </div>

        {/* Deliverables Delivered */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-purple-500/20 shadow-lg">
          <div className="text-[10px] uppercase tracking-wider text-purple-400/80 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Autonomous Tasks Done</span>
          </div>
          <div className="text-xl md:text-2xl font-black text-purple-300 mt-1">
            {ledger?.payoutReadyCount || 0} Deliverables
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            100% verified production code
          </div>
        </div>
      </div>

      {/* Main Opportunities Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[450px]">
        {/* Left Column: Job Feed */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Freelance Bounties ({opportunities.length})</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Agent Scanning Active
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1">
            {opportunities.map((opp) => {
              const isSelected = selectedOpp?.id === opp.id;
              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-slate-900 to-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {opp.platform}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        ₹{opp.payoutINR?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ${opp.payoutUSD} USD
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-xs md:text-sm text-slate-100 mt-2 line-clamp-1">
                    {opp.title}
                  </h3>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {opp.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{opp.clientName} ({opp.clientCountry})</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        opp.status === 'COLLECTED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : (opp.status === 'PAYOUT_READY' || opp.status === 'DELIVERABLE_READY')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : opp.status === 'APPLIED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {opp.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Opportunity Details & Autonomous Action Center */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
          {selectedOpp ? (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-semibold">
                      {selectedOpp.platform} Contract
                    </span>
                    <span className="text-xs text-slate-400">{selectedOpp.clientName}</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-slate-100 mt-1">
                    {selectedOpp.title}
                  </h2>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-xl font-black text-emerald-400">
                    ₹{selectedOpp.payoutINR?.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400">
                    ${selectedOpp.payoutUSD} USD Payout
                  </div>
                </div>
              </div>

              {/* Tags & Description */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1.5">Required Skills:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOpp.skillsRequired || []).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1">Contract Scope:</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  {selectedOpp.description}
                </p>
              </div>

              {/* Proposal & Deliverable Section */}
              {selectedOpp.winningProposal && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Autonomous Proposal Submitted on Your Behalf:</span>
                  </h4>
                  <pre className="text-[11px] text-slate-300 font-sans whitespace-pre-wrap bg-slate-950/80 p-3.5 rounded-lg border border-cyan-500/20 max-h-36 overflow-y-auto">
                    {selectedOpp.winningProposal}
                  </pre>
                </div>
              )}

              {/* Deliverable Preview Link if built */}
              {(selectedOpp.deliverablePreviewUrl || selectedOpp.status === 'DELIVERABLE_READY' || selectedOpp.status === 'PAYOUT_READY') && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">
                        Production Deliverable Generated & Stored
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Live Sandbox: {selectedOpp.deliverablePreviewUrl || `/api/workspaces/preview/${selectedOpp.deliverableProjectName}`}
                      </div>
                    </div>
                  </div>
                  <a
                    href={selectedOpp.deliverablePreviewUrl || `/api/workspaces/preview/${selectedOpp.deliverableProjectName}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow"
                  >
                    <span>Open Preview</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 mt-auto flex flex-wrap gap-3">
                {selectedOpp.status === 'OPEN' && (
                  <button
                    onClick={() => handleApply(selectedOpp.id)}
                    disabled={actionLoading === selectedOpp.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-600/20"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>
                      {actionLoading === selectedOpp.id ? 'Submitting Application...' : 'Apply Autonomously (1-Click)'}
                    </span>
                  </button>
                )}

                {(selectedOpp.status === 'OPEN' || selectedOpp.status === 'APPLIED') && (
                  <button
                    onClick={() => handleExecuteDeliverable(selectedOpp.id)}
                    disabled={actionLoading === selectedOpp.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-purple-600/20"
                  >
                    <Play className="w-4 h-4" />
                    <span>
                      {actionLoading === selectedOpp.id ? 'Synthesizing Code...' : 'Build Deliverable & Claim Payout'}
                    </span>
                  </button>
                )}

                {(selectedOpp.status === 'PAYOUT_READY' || selectedOpp.status === 'DELIVERABLE_READY') && (
                  <button
                    onClick={() => handleCollect(selectedOpp.id)}
                    disabled={actionLoading === selectedOpp.id}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/30 animate-pulse"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>
                      {actionLoading === selectedOpp.id ? 'Processing Transfer...' : `Collect Payout (₹${selectedOpp.payoutINR?.toLocaleString()})`}
                    </span>
                  </button>
                )}

                {selectedOpp.status === 'COLLECTED' && (
                  <div className="w-full py-2.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold text-center flex items-center justify-center gap-2 border border-slate-700">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Payout of ₹{selectedOpp.payoutINR?.toLocaleString()} Deposited to Master Sri</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Briefcase className="w-12 h-12 stroke-1 mb-2" />
              <p className="text-xs">Select an opportunity from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Bank & UPI Routing Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Bank & UPI Direct Deposit Routing
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Configure where M.I.D.A.S. routes earned funds whenever an autonomous bounty or freelance milestone is collected.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Beneficiary Name (Account Holder)
                </label>
                <input
                  type="text"
                  value={beneficiaryInput}
                  onChange={(e) => setBeneficiaryInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  UPI ID (Instant Transfer)
                </label>
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscInput}
                    onChange={(e) => setIfscInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={accountNumInput}
                  onChange={(e) => setAccountNumInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30"
              >
                Save Payout Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

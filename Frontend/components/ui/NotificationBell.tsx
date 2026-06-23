"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, ShieldAlert, Award, FileText, AlertCircle, ArrowUpRight, TrendingUp } from "lucide-react";
import Modal from "@/components/ui/Modal";

export interface NotificationItem {
  id: string;
  type: 'guarantor_request' | 'loan_status' | 'payment_due' | 'trust_update' | 'kyc_verified';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  status?: 'pending' | 'accepted' | 'declined';
  loanDetails?: {
    borrowerName: string;
    borrowerScore: number;
    amount: string;
    duration: string;
  };
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "guarantor_request",
    title: "Guarantor Request",
    description: "Rahul Sharma wants you as guarantor for ₹10,000 loan",
    time: "2 hours ago",
    isRead: false,
    status: "pending",
    loanDetails: {
      borrowerName: "Rahul Sharma",
      borrowerScore: 685,
      amount: "₹10,000",
      duration: "6 Months"
    }
  },
  {
    id: "notif-2",
    type: "loan_status",
    title: "Loan Approved",
    description: "Your ₹12,000 loan has been approved and disbursed",
    time: "2 days ago",
    isRead: true
  },
  {
    id: "notif-3",
    type: "payment_due",
    title: "Payment Reminder",
    description: "₹2,400 due in 3 days — Nov 28",
    time: "1 day ago",
    isRead: false
  },
  {
    id: "notif-4",
    type: "trust_update",
    title: "Trust Score Update",
    description: "Your trust score increased by +8 points",
    time: "3 days ago",
    isRead: true
  },
  {
    id: "notif-5",
    type: "kyc_verified",
    title: "KYC Verified",
    description: "Identity verification complete — Level 2 unlocked",
    time: "5 days ago",
    isRead: true
  }
];

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("mock_notifications");
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
        localStorage.setItem("mock_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
      }
    }
  }, []);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    localStorage.setItem("mock_notifications", JSON.stringify(updated));
    // Trigger storage sync event
    window.dispatchEvent(new Event("notifications_updated"));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    saveNotifications(updated);
  };

  const handleDecline = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id 
        ? { ...n, isRead: true, status: 'declined' as const, description: "You declined Rahul Sharma's guarantor request." } 
        : n
    );
    saveNotifications(updated);
    alert("Guarantor request declined.");
  };

  const openWarningConsent = (notif: NotificationItem) => {
    setSelectedNotif(notif);
    setShowWarningModal(true);
    setIsOpen(false);
  };

  const handleAcceptConsent = () => {
    if (!selectedNotif) return;
    
    // 1. Update notification
    const updatedNotif = notifications.map(n => 
      n.id === selectedNotif.id 
        ? { 
            ...n, 
            isRead: true, 
            status: 'accepted' as const, 
            description: "You accepted Rahul Sharma's request. Guarantee active." 
          } 
        : n
    );
    saveNotifications(updatedNotif);

    // 2. Add to locked guarantees in localStorage
    if (typeof window !== 'undefined') {
      const existingGuarantees = localStorage.getItem("locked_guarantees");
      const list = existingGuarantees ? JSON.parse(existingGuarantees) : [];
      
      const newGuarantee = {
        id: `GUR-${Date.now()}`,
        borrowerName: selectedNotif.loanDetails?.borrowerName || "Rahul Sharma",
        borrowerScore: selectedNotif.loanDetails?.borrowerScore || 685,
        amount: selectedNotif.loanDetails?.amount || "₹10,000",
        duration: selectedNotif.loanDetails?.duration || "6 Months",
        status: "Active Loan",
        repaidProgress: 0 // 0% repaid initially
      };
      
      list.push(newGuarantee);
      localStorage.setItem("locked_guarantees", JSON.stringify(list));
      
      // Dispatch custom event to notify components (like Dashboard)
      window.dispatchEvent(new Event("guarantees_updated"));
    }

    setShowWarningModal(false);
    setSelectedNotif(null);
    alert("Agreement locked! You are now an active guarantor for Rahul Sharma's loan.");
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'guarantor_request':
        return <ShieldAlert className="w-4 h-4 text-warning" />;
      case 'loan_status':
        return <Check className="w-4 h-4 text-success" />;
      case 'payment_due':
        return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'trust_update':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'kyc_verified':
        return <Award className="w-4 h-4 text-accent" />;
      default:
        return <Bell className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 border border-borderCustom rounded-xl flex items-center justify-center hover:bg-slate-50 text-text-secondary transition-all"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[320px] bg-white border border-cardBorder rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[420px]">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-borderCustom flex items-center justify-between text-xs">
            <span className="font-bold text-text-primary">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-primary hover:underline font-bold transition-all"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1 scrollbar-thin">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 space-y-2 transition-all cursor-pointer ${
                    notif.isRead ? "bg-white" : "bg-blue-50/30"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold leading-none ${notif.isRead ? "text-text-primary" : "text-primary"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[9px] text-text-muted font-medium">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-normal font-medium break-words">
                        {notif.description}
                      </p>
                    </div>
                  </div>

                  {/* Guarantor request inline controls */}
                  {notif.type === 'guarantor_request' && notif.status === 'pending' && (
                    <div className="flex gap-2 pl-9.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openWarningConsent(notif);
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecline(notif.id);
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-danger border border-red-150 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        <X className="w-3 h-3" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                  {notif.type === 'guarantor_request' && notif.status === 'accepted' && (
                    <div className="pl-9.5 text-[10px] text-success font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                      <Check className="w-3.5 h-3.5" />
                      <span>Guarantee Locked</span>
                    </div>
                  )}

                  {notif.type === 'guarantor_request' && notif.status === 'declined' && (
                    <div className="pl-9.5 text-[10px] text-danger font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                      <X className="w-3.5 h-3.5" />
                      <span>Request Declined</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-text-muted font-medium">
                No notifications to display
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Consent Modal */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => {
          setShowWarningModal(false);
          setSelectedNotif(null);
        }}
        title="Consent & Guarantor Agreement"
      >
        <div className="space-y-4 font-sans text-xs">
          
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-danger leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">⚠️ High Liability Risk Warning</p>
              <p className="mt-1 font-medium text-[11px]">
                By accepting you <strong>CANNOT</strong> exit this agreement until the loan is fully repaid. 
                Your trust score will be penalized automatically if the borrower defaults.
              </p>
            </div>
          </div>

          {selectedNotif?.loanDetails && (
            <div className="p-4 bg-slate-50 border border-borderCustom rounded-xl space-y-3">
              <span className="font-bold text-text-primary uppercase tracking-wider block border-b border-slate-200 pb-2">
                Agreement Parameters
              </span>
              <div className="grid grid-cols-2 gap-y-2.5 font-medium text-text-secondary">
                <div>Borrower:</div>
                <div className="text-text-primary font-bold text-right">{selectedNotif.loanDetails.borrowerName}</div>
                <div>Borrower Trust Score:</div>
                <div className="text-primary font-bold text-right">{selectedNotif.loanDetails.borrowerScore}</div>
                <div>Guarantee Liability Amount:</div>
                <div className="text-text-primary font-mono font-bold text-right">{selectedNotif.loanDetails.amount}</div>
                <div>Loan Term:</div>
                <div className="text-text-primary font-bold text-right">{selectedNotif.loanDetails.duration}</div>
                <div className="col-span-2 pt-2 border-t border-dashed border-slate-200 text-danger text-[10px] font-semibold leading-normal">
                  * Maximum Trust Score Penalty on default: -150 points. Smart contract enforces this ledger block automatically.
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => {
                setShowWarningModal(false);
                setSelectedNotif(null);
              }}
              className="flex-1 py-2.5 border border-borderCustom hover:bg-slate-50 text-text-secondary font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptConsent}
              className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider text-[11px]"
            >
              I Understand — Accept
            </button>
          </div>

        </div>
      </Modal>
    </div>
  );
}

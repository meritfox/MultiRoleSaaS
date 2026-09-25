"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createChildProfileForParent, linkChildByStudentCode } from "@/lib/services/users";
import { EDUCATION_BOARDS, GRADES_LIST } from "@/lib/data/geo-schools";
import { StudentProfile } from "@/types";
import { X, UserPlus, Link2, QrCode } from "lucide-react";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  parentCity?: string;
  onChildAdded: (child: StudentProfile) => void;
}

type TabMode = "CREATE" | "LINK" | "INVITE";

export function AddChildModal({
  isOpen,
  onClose,
  parentId,
  onChildAdded,
}: AddChildModalProps) {
  const [tab, setTab] = useState<TabMode>("CREATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mode 1: Create Child Profile
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Class 6");
  const [school, setSchool] = useState("DAV Public School, Bistupur");
  const [board, setBoard] = useState("CBSE");

  // Mode 2: Link Existing Student
  const [linkQuery, setLinkQuery] = useState("");

  if (!isOpen) return null;

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter child full name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const child = await createChildProfileForParent(parentId, {
        displayName: name.trim(),
        grade,
        school,
        board,
      });
      setSuccess("Child profile created successfully!");
      onChildAdded(child);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to create child profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkQuery.trim()) {
      setError("Please enter student ID, invitation code, or name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const child = await linkChildByStudentCode(parentId, linkQuery.trim());
      if (!child) {
        setError("No student found with that ID, code, or name.");
        return;
      }
      setSuccess(`Linked ${child.displayName} successfully!`);
      onChildAdded(child);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Failed to link student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#DC2626]" />
            <h3 className="text-lg font-bold text-slate-900">Add Your Child</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("CREATE")}
            className={`py-2 px-2 rounded-lg transition-all ${
              tab === "CREATE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Create Profile
          </button>
          <button
            type="button"
            onClick={() => setTab("LINK")}
            className={`py-2 px-2 rounded-lg transition-all ${
              tab === "LINK" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            2. Link Existing
          </button>
          <button
            type="button"
            onClick={() => setTab("INVITE")}
            className={`py-2 px-2 rounded-lg transition-all ${
              tab === "INVITE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            3. Invitation Code
          </button>
        </div>

        {tab === "CREATE" && (
          <form onSubmit={handleCreateChild} className="space-y-4">
            <p className="text-xs text-slate-500">
              Create a child profile by name (no child email required). System will generate an ID.
            </p>
            <Input
              label="Child's Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sinha"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Class / Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs"
                >
                  {GRADES_LIST.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs"
                >
                  {EDUCATION_BOARDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="School Name *"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. DAV Public School"
            />

            <Button type="submit" isLoading={loading} className="w-full mt-2">
              Create Child Profile
            </Button>
          </form>
        )}

        {tab === "LINK" && (
          <form onSubmit={handleLinkStudent} className="space-y-4">
            <p className="text-xs text-slate-500">
              Link a child who already has an OmniStud ID (e.g. OS-2026-XXXXX), email, or registered name.
            </p>
            <Input
              label="Student ID / Code / Email / Full Name *"
              value={linkQuery}
              onChange={(e) => setLinkQuery(e.target.value)}
              placeholder="e.g. OS-2026-10294 or student name"
              icon={<Link2 className="h-4 w-4" />}
            />
            <Button type="submit" isLoading={loading} className="w-full">
              Find & Link Child
            </Button>
          </form>
        )}

        {tab === "INVITE" && (
          <div className="space-y-4 text-center py-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Parent Link Invitation</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Share this code with your student account or school coordinator to approve link.
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl font-mono text-sm tracking-wider text-slate-800">
              LINK-{parentId.slice(0, 8).toUpperCase()}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full text-xs"
              onClick={() => {
                navigator.clipboard?.writeText(`LINK-${parentId.slice(0, 8).toUpperCase()}`);
                alert("Invitation code copied to clipboard!");
              }}
            >
              Copy Invitation Code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


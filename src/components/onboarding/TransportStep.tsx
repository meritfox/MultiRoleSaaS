import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Bus, MapPin, Building2, Clock, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { TransportNeedOption } from "@/types";

export interface TransportStepData {
  needTransport: TransportNeedOption;
  pickupLocation: string;
  dropLocation: string;
  morningPickup: boolean;
  afternoonDrop: boolean;
  preferredPickupTime: string;
  preferredDropTime: string;
  currentProvider: string;
  startDate: string;
  specialRequirement: string;
}

interface TransportStepProps {
  data: TransportStepData;
  onChange: (data: TransportStepData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function TransportStep({ data, onChange, onSubmit, onBack, isLoading }: TransportStepProps) {
  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Bus className="h-4 w-4 text-[#DC2626]" />
          Step 3: School Transportation Requirement
        </h3>
        <p className="text-xs text-slate-500">
          OmniStud immediately captures demand and matches you with verified school transporters.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900">
          Does your child need school transportation?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { val: "YES", label: "Yes, I need transport", desc: "Create active transport demand" },
            { val: "ALREADY_HAVE", label: "Already have transport", desc: "Private arrangement / school van" },
            { val: "NO", label: "No transport required", desc: "Self pickup and drop" },
            { val: "NOT_SURE", label: "Not sure yet", desc: "Explore available options" },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChange({ ...data, needTransport: opt.val as TransportNeedOption })}
              className={`flex flex-col text-left p-3 rounded-xl border-2 transition-all ${
                data.needTransport === opt.val
                  ? "border-[#DC2626] bg-[#DC2626]/5"
                  : "border-slate-200/70 hover:border-slate-300"
              }`}
            >
              <span className={`text-sm font-semibold ${data.needTransport === opt.val ? "text-[#DC2626]" : "text-slate-900"}`}>
                {opt.label}
              </span>
              <span className="text-xs text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {(data.needTransport === "YES" || data.needTransport === "NOT_SURE") && (
        <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
            <Sparkles className="h-3.5 w-3.5" /> Active Transport Demand Record
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pickup Location *"
              value={data.pickupLocation}
              onChange={(e) => onChange({ ...data, pickupLocation: e.target.value })}
              placeholder="e.g. Bistupur Market / Landmark"
              icon={<MapPin className="h-4 w-4" />}
            />
            <Input
              label="Drop Location *"
              value={data.dropLocation}
              onChange={(e) => onChange({ ...data, dropLocation: e.target.value })}
              placeholder="e.g. DAV Public School Gate"
              icon={<Building2 className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Preferred Morning Pickup Time"
              value={data.preferredPickupTime}
              onChange={(e) => onChange({ ...data, preferredPickupTime: e.target.value })}
              placeholder="e.g. 07:15 AM"
              icon={<Clock className="h-4 w-4" />}
            />
            <Input
              label="Preferred Afternoon Drop Time"
              value={data.preferredDropTime}
              onChange={(e) => onChange({ ...data, preferredDropTime: e.target.value })}
              placeholder="e.g. 01:45 PM"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.morningPickup}
                onChange={(e) => onChange({ ...data, morningPickup: e.target.checked })}
                className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
              />
              Morning pickup required
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={data.afternoonDrop}
                onChange={(e) => onChange({ ...data, afternoonDrop: e.target.checked })}
                className="rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
              />
              Afternoon drop required
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="Transport Start Date"
              type="date"
              value={data.startDate}
              onChange={(e) => onChange({ ...data, startDate: e.target.value })}
            />
            <Input
              label="Current Transport Provider (Optional)"
              value={data.currentProvider}
              onChange={(e) => onChange({ ...data, currentProvider: e.target.value })}
              placeholder="e.g. Private Van / Self"
            />
          </div>

          <Input
            label="Special Requirements (Optional)"
            value={data.specialRequirement}
            onChange={(e) => onChange({ ...data, specialRequirement: e.target.value })}
            placeholder="e.g. Specific bus stop, student medical caution"
          />
        </div>
      )}

      <div className="pt-4 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Child
        </Button>
        <Button type="button" onClick={onSubmit} isLoading={isLoading} size="lg">
          Complete Registration & Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


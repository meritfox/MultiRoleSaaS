import React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GraduationCap, Building2, User, ArrowLeft, ArrowRight } from "lucide-react";
import {
  EDUCATION_BOARDS,
  GRADES_LIST,
  GENDERS,
  HOBBIES_LIST,
  getSchoolsForCity,
} from "@/lib/data/geo-schools";

export interface ChildStepData {
  displayName: string;
  photoURL: string;
  dateOfBirth: string;
  grade: string;
  school: string;
  customSchool: string;
  board: string;
  campus: string;
  gender: string;
  age: number;
  hobby: string;
  studentIdCode: string;
}

interface ChildStepProps {
  data: ChildStepData;
  city: string;
  onChange: (data: ChildStepData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ChildStep({ data, city, onChange, onNext, onBack }: ChildStepProps) {
  const schools = getSchoolsForCity(city);

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#DC2626]" />
            Step 2: Add Your Child
          </h3>
          <p className="text-xs text-slate-500">
            Identified by Child Name & System Student ID (no child email required).
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-mono text-slate-700">
          ID: {data.studentIdCode}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Child's Full Name *"
          value={data.displayName}
          onChange={(e) => onChange({ ...data, displayName: e.target.value })}
          placeholder="e.g. Aarav Sinha"
          icon={<User className="h-4 w-4" />}
        />
        <Input
          label="Date of Birth (Optional)"
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => onChange({ ...data, dateOfBirth: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Class / Grade *</label>
          <select
            value={data.grade}
            onChange={(e) => onChange({ ...data, grade: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none"
          >
            {GRADES_LIST.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Board *</label>
          <select
            value={data.board}
            onChange={(e) => onChange({ ...data, board: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none"
          >
            {EDUCATION_BOARDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Gender</label>
          <select
            value={data.gender}
            onChange={(e) => onChange({ ...data, gender: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none"
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          School Name (Populated based on {city}) *
        </label>
        <select
          value={data.school}
          onChange={(e) => onChange({ ...data, school: e.target.value })}
          className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none"
        >
          {schools.map((sch) => (
            <option key={sch} value={sch}>{sch}</option>
          ))}
        </select>
      </div>

      {data.school === "Other School (Specify)" && (
        <Input
          label="Enter School Name *"
          value={data.customSchool}
          onChange={(e) => onChange({ ...data, customSchool: e.target.value })}
          placeholder="e.g. St. Francis School"
          icon={<Building2 className="h-4 w-4" />}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="School Branch / Campus (Optional)"
          value={data.campus}
          onChange={(e) => onChange({ ...data, campus: e.target.value })}
          placeholder="e.g. Bistupur / Main Campus"
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Hobby / Activity (Optional)</label>
          <select
            value={data.hobby}
            onChange={(e) => onChange({ ...data, hobby: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none"
          >
            {HOBBIES_LIST.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Parent
        </Button>
        <Button type="button" onClick={onNext}>
          Next: Transport Requirement <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      </div>
    </div>
  );
}


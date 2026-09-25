import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Phone, MapPin, ArrowRight } from 'lucide-react';
import {
  INDIAN_STATES_AND_CITIES,
  PARENT_TITLES,
  PARENT_RELATIONSHIPS,
  PROFESSIONS_LIST,
  QUALIFICATIONS_LIST,
} from '@/lib/data/geo-schools';

export interface ParentStepData {
  title: string;
  displayName: string;
  phoneNumber: string;
  email: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  relationship: string;
  profession: string;
  qualification: string;
}

interface ParentStepProps {
  data: ParentStepData;
  onChange: (data: ParentStepData) => void;
  onNext: () => void;
  isParent: boolean;
  isLoading?: boolean;
}

export function ParentStep({ data, onChange, onNext, isParent, isLoading }: ParentStepProps) {
  const cities = INDIAN_STATES_AND_CITIES.find(
    (s) => s.state.toLowerCase() === data.state.toLowerCase()
  )?.cities.map((c) => c.city) || [];

  const handleStateChange = (stateName: string) => {
    const matched = INDIAN_STATES_AND_CITIES.find(
      (s) => s.state.toLowerCase() === stateName.toLowerCase()
    );
    const firstCity = matched?.cities[0]?.city || '';
    onChange({ ...data, state: stateName, city: firstCity });
  };

  return (
    <div className='space-y-5'>
      <div className='border-b border-slate-100 pb-3'>
        <h3 className='font-semibold text-slate-900 flex items-center gap-2'>
          <User className='h-4 w-4 text-[#DC2626]' />
          {isParent ? 'Step 1: Parent / Guardian Information' : 'Basic Information'}
        </h3>
        <p className='text-xs text-slate-500'>
          State and city auto-populate school listings for minimal typing.
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
        <div className='sm:col-span-1 space-y-1.5'>
          <label className='text-sm font-medium text-slate-700'>Title</label>
          <select
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            className='flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none'
          >
            {PARENT_TITLES.map((t) => (
              <option key={t} value={t}>{t}.</option>
            ))}
          </select>
        </div>

        <div className='sm:col-span-3'>
          <Input
            label='Full Name *'
            value={data.displayName}
            onChange={(e) => onChange({ ...data, displayName: e.target.value })}
            placeholder='Parent full name'
            icon={<User className='h-4 w-4' />}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Input
          label='Mobile Number *'
          value={data.phoneNumber}
          onChange={(e) => onChange({ ...data, phoneNumber: e.target.value })}
          placeholder='+91 98765 43210'
          icon={<Phone className='h-4 w-4' />}
        />
        <Input
          label='Email Address'
          type='email'
          value={data.email}
          disabled
          placeholder='parent@example.com'
          icon={<User className='h-4 w-4' />}
        />
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='space-y-1.5'>
          <label className='text-sm font-medium text-slate-700'>State *</label>
          <select
            value={data.state}
            onChange={(e) => handleStateChange(e.target.value)}
            className='flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none'
          >
            {INDIAN_STATES_AND_CITIES.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>
        </div>

        <div className='space-y-1.5'>
          <label className='text-sm font-medium text-slate-700'>City (Filtered) *</label>
          <select
            value={data.city}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
            className='flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none'
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Input
          label='Pincode *'
          value={data.pincode}
          onChange={(e) => onChange({ ...data, pincode: e.target.value })}
          placeholder='e.g. 831001'
        />
      </div>

      <Input
        label='Complete Address / Street *'
        value={data.address}
        onChange={(e) => onChange({ ...data, address: e.target.value })}
        placeholder='House / Flat No., Landmark, Area'
        icon={<MapPin className='h-4 w-4' />}
      />

      {isParent && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1'>
          <div className='space-y-1.5'>
            <label className='text-sm font-medium text-slate-700'>Relationship *</label>
            <select
              value={data.relationship}
              onChange={(e) => onChange({ ...data, relationship: e.target.value })}
              className='flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none'
            >
              {PARENT_RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-medium text-slate-700'>Profession</label>
            <select
              value={data.profession}
              onChange={(e) => onChange({ ...data, profession: e.target.value })}
              className='flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none'
            >
              {PROFESSIONS_LIST.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-medium text-slate-700'>Qualification (Optional)</label>
            <select
              value={data.qualification}
              onChange={(e) => onChange({ ...data, qualification: e.target.value })}
              className='flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:border-[#DC2626]/40 focus:bg-white focus:outline-none'
            >
              {QUALIFICATIONS_LIST.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className='pt-4 flex justify-end'>
        <Button type='button' onClick={onNext} isLoading={isLoading} className='w-full sm:w-auto'>
          {isParent ? 'Next: Add Your Child' : 'Complete Profile'}
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requestStatusVariant, type BadgeVariant } from "@/lib/utils";
import { Service, ServiceRequest, RATE_UNIT_LABELS } from "@/types";
import { Star, Clock, CheckCircle, XCircle } from "lucide-react";

const PROVIDER_TYPE_META: Record<string, { label: string; variant: BadgeVariant }> = {
  TEACHER: { label: "Teacher", variant: "indigo" },
  TRANSPORTER: { label: "Transporter", variant: "warning" },
  INSTITUTION: { label: "Institution", variant: "purple" },
};

const STATUS_LABELS: Record<ServiceRequest["status"], string> = {
  PENDING: "Request Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_ICONS: Record<ServiceRequest["status"], React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  APPROVED: <CheckCircle className="h-3.5 w-3.5" />,
  REJECTED: <XCircle className="h-3.5 w-3.5" />,
};

interface ServiceCardProps {
  service: Service;
  /** Existing request made by the student for this service (drives the footer state). */
  requestStatus?: ServiceRequest["status"];
  /** Inline request action (dashboard home). */
  onRequest?: () => void;
  requesting?: boolean;
  /** Detail link action (tutors / transport listings). */
  detailHref?: string;
  detailLabel?: string;
  /** Extra metadata chips to render between the description and the footer. */
  chips?: string[];
  /** Fallback rate-unit label when the service has none (e.g. "month"). */
  defaultRateUnitLabel?: string;
}

/** The one canonical card used to present a service across student listing pages. */
export function ServiceCard({
  service,
  requestStatus,
  onRequest,
  requesting,
  detailHref,
  detailLabel,
  chips,
  defaultRateUnitLabel,
}: ServiceCardProps) {
  const meta = PROVIDER_TYPE_META[service.providerType] ?? {
    label: service.providerType,
    variant: "slate" as BadgeVariant,
  };

  let action: React.ReactNode = null;
  if (requestStatus) {
    action = (
      <Badge variant={requestStatusVariant(requestStatus)} dot={false}>
        <span className="flex items-center gap-1">
          {STATUS_ICONS[requestStatus]}
          {STATUS_LABELS[requestStatus]}
        </span>
      </Badge>
    );
  } else if (onRequest) {
    action = (
      <Button size="sm" onClick={onRequest} isLoading={requesting}>
        Request Service
      </Button>
    );
  } else if (detailHref) {
    action = (
      <Link
        href={detailHref}
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-[#ef4444] to-[#DC2626] px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-all hover:to-[#B91C1C]"
      >
        {detailLabel ?? "View"}
      </Link>
    );
  }

  const rateUnitLabel = service.rateUnit
    ? RATE_UNIT_LABELS[service.rateUnit]
    : defaultRateUnitLabel ?? "";

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/60 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-lift">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {service.rating !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-slate-700">{service.rating}</span>({service.reviews ?? 0})
          </span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900">{service.name}</h3>
      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{service.description}</p>

      {chips && chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-lg font-bold text-[#DC2626]">
          ₹{service.price}
          {rateUnitLabel && (
            <span className="text-xs font-normal text-slate-500"> / {rateUnitLabel}</span>
          )}
        </span>
        {action}
      </div>
    </div>
  );
}

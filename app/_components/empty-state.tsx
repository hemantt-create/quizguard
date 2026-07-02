import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-[#dfe5ec] bg-white text-sm font-bold text-[#334155]">
        QG
      </div>
      <h3 className="text-base font-semibold text-[#101828]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

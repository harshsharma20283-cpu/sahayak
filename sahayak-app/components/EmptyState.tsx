import Link from "next/link";

interface EmptyStateProps {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function EmptyState({ title, body, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="card space-y-2 text-center">
      <h2 className="heading-3">{title}</h2>
      <p className="text-neutral">{body}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="inline-block font-semibold text-primary underline">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

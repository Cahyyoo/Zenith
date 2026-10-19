import { MailCheckIcon } from "lucide-react";
import type { ReactNode } from "react";

export function InboxNotice({ message, action }: { message: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 py-4 text-center">
      <MailCheckIcon className="size-8 text-primary" />
      <p className="font-medium">Check your inbox</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

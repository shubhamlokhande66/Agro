import clsx from "clsx";

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <div className="min-w-full px-4 sm:px-0">{children}</div>
    </div>
  );
}

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <table className={clsx("w-full border-collapse text-[12.5px]", className)}>
      {children}
    </table>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={clsx(
        "sticky top-0 z-[1] border-b border-line bg-surface px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  mono,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  mono?: boolean;
}) {
  return (
    <td
      className={clsx(
        "border-b border-line/70 px-2.5 py-2 text-ink",
        mono && "num",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  highlight,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <tr
      className={clsx(
        "transition-colors hover:bg-surface-2/60",
        highlight && "bg-surface-2/50 font-semibold",
        className,
      )}
    >
      {children}
    </tr>
  );
}

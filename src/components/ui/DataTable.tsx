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
    <table className={clsx("w-full border-collapse text-xs", className)}>
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
        "num border-b border-line px-2.5 py-2 text-[10px] font-medium uppercase tracking-wide text-ink-faint",
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
        "border-b border-line px-2.5 py-2 text-ink",
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

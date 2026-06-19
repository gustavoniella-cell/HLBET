import { flagUrl } from "@/lib/flags";

export default function Flag({
  nome,
  className = "",
}: {
  nome: string;
  className?: string;
}) {
  const url = flagUrl(nome, 20);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={18}
      height={13}
      className={`inline-block rounded-[1px] align-[-2px] ${className}`}
    />
  );
}

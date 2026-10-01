import Image from "next/image";

type AkbConstructionMarkProps = {
  decorative?: boolean;
};

export function AkbConstructionMark({
  decorative = false,
}: AkbConstructionMarkProps) {
  return (
    <div
      className="akb-construction-mark"
      aria-hidden={decorative || undefined}
    >
      <svg
        className="akb-construction-mark__geometry"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <path className="akb-construction-mark__axis" d="M34 112H168" />
        <path className="akb-construction-mark__axis" d="M99 30V170" />
        <path
          className="akb-construction-mark__vector"
          d="M48 145L98 54L151 139"
        />
        <path className="akb-construction-mark__vector" d="M68 126L139 73" />
        <path
          className="akb-construction-mark__arc"
          d="M55 77C75 42 126 35 153 69"
        />
        <path
          className="akb-construction-mark__arc akb-construction-mark__arc--lower"
          d="M151 127C131 160 82 166 53 136"
        />
        <circle
          className="akb-construction-mark__node"
          cx="99"
          cy="101"
          r="2"
        />
        <circle
          className="akb-construction-mark__node"
          cx="139"
          cy="73"
          r="1.5"
        />
        <path
          className="akb-construction-mark__tick"
          d="M158 145H174M166 137V153"
        />
      </svg>

      <div className="akb-construction-mark__identity">
        <Image
          src="/brand/akb-logo-dark.svg"
          alt=""
          fill
          sizes="160px"
          className="object-contain dark:hidden"
        />
        <Image
          src="/brand/akb-logo-light.svg"
          alt=""
          fill
          sizes="160px"
          className="hidden object-contain dark:block"
        />
      </div>
      <span className="akb-construction-mark__origin" />
    </div>
  );
}

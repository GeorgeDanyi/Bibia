export function CurvedSeparator() {
  return (
    <div className="absolute -bottom-[1px] left-0 right-0 h-[96px] md:h-[120px] overflow-hidden -mb-px" aria-hidden="true">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,0 C360,80 720,40 1080,60 C1260,70 1440,20 1440,20 L1440,120 L0,120 Z"
          fill="#ecfdf5"
        />
      </svg>
    </div>
  )
}

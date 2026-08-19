interface BrandLogoProps {
  label: string;
  size?: 'default' | 'compact';
}

const sizeClasses = {
  compact: 'h-9 max-w-[9.75rem] min-[420px]:h-10 min-[420px]:max-w-[11rem]',
  default: 'h-11 max-w-[14rem] sm:h-12'
};

export function BrandLogo({ label, size = 'default' }: BrandLogoProps) {
  return (
    <a className="inline-flex min-h-11 items-center rounded-control" href="/" aria-label={label}>
      <img
        className={`${sizeClasses[size]} w-auto object-contain`}
        src="/hoopjot-logo.png"
        alt=""
        aria-hidden="true"
      />
    </a>
  );
}

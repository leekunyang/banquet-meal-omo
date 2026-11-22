import QRCode from 'qrcode';

/** Server-rendered QR code (inline SVG, no client JS). */
export async function QrCode({ value, size = 168, label }: { value: string; size?: number; label: string }) {
  const svg = await QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#231F1C', light: '#FFFFFF' } });
  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className="[&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

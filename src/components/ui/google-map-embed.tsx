import { cn } from "@/lib/utils";

interface GoogleMapEmbedProps {
  address: string;
  className?: string;
}

/**
 * Simple Google Maps embed using iframe (no API key required)
 */
export function GoogleMapEmbed({ address, className }: GoogleMapEmbedProps) {
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <iframe
      src={mapUrl}
      className={cn("w-full h-full border-0 rounded-2xl", className)}
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={`Map showing ${address}`}
    />
  );
}

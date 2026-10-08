import { MapPin, Clock, Phone } from "lucide-react";
import { useBusinessSettings } from "@/hooks/use-business";
import { formatHoursLines } from "@/lib/format-hours";
import { GoogleMapEmbed } from "@/components/ui/google-map-embed";
import {
  FALLBACK_HOURS,
  PICKUP_LOCATION_NAME,
  STREET_ADDRESS,
} from "@/config/business";

export function Locations() {
  const { data: business } = useBusinessSettings();
  const hoursLines = formatHoursLines(business?.hours ?? FALLBACK_HOURS);

  return (
    <section id="locations" className="py-24 bg-card">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="label-text block mb-3">Visit Us</span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown">
            Find Us Locally
          </h2>
        </div>

        {/* Main Location */}
        <div className="bg-background rounded-3xl overflow-hidden transition-all hover:shadow-lifted hover:-translate-y-1 md:col-span-2 max-w-2xl mx-auto w-full">
          {/* Map */}
          <div className="h-64 overflow-hidden">
            <GoogleMapEmbed
              address={`${business?.address_line1 || STREET_ADDRESS}, ${business?.city || "Portsmouth"}, ${business?.state || "VA"} ${business?.zip || "23704"}`}
              className="rounded-none rounded-t-3xl"
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <h3 className="font-display text-3xl font-semibold text-brand-brown mb-6 text-center">
              {PICKUP_LOCATION_NAME}
            </h3>
            <div className="space-y-4 text-brand-warm-gray max-w-lg mx-auto">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-brand-olive mt-0.5 flex-shrink-0" />
                <span className="text-lg">
                  {business?.address_line1 || STREET_ADDRESS}
                  <br />
                  {business?.city || "Portsmouth"}, {business?.state || "VA"}{" "}
                  {business?.zip || "23704"}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-brand-olive mt-0.5 flex-shrink-0" />
                <span className="text-lg">
                  {hoursLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < hoursLines.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </div>
              {business?.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="h-6 w-6 text-brand-olive flex-shrink-0" />
                  <a
                    href={`tel:${business.phone}`}
                    className="hover:text-brand-berry transition-colors text-lg"
                  >
                    {business.phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

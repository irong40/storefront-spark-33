import { useActiveAnnouncements } from "@/hooks/use-announcements";

export function AnnouncementBanner() {
  const { data: announcements, isLoading } = useActiveAnnouncements();

  if (isLoading || !announcements || announcements.length === 0) {
    return null;
  }

  // Combine all announcements into a single scrolling message
  const combinedMessage = announcements
    .map((a) => `${a.emoji || "✨"} ${a.message}`)
    .join("     •     ");

  return (
    <div className="bg-brand-berry text-white py-2 overflow-hidden">
      <div className="relative">
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-4 text-sm font-medium">{combinedMessage}</span>
          <span className="mx-4 text-sm font-medium">{combinedMessage}</span>
        </div>
      </div>
    </div>
  );
}

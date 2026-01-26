import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'announcement-dismissed-timestamp';
// Show again after 24 hours
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

export function AnnouncementBar() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (!dismissedAt || now - parseInt(dismissedAt) > DISMISS_DURATION) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());

        // Dispatch event so Layout can adjust padding if needed (optional)
        window.dispatchEvent(new Event('resize'));
    };

    if (!isVisible) return null;

    return (
        <div className="bg-brand-brown text-white px-4 py-2 relative z-[60] overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,_rgba(255,255,255,0.2)_1px,_transparent_0)] bg-[length:24px_24px]" />

            <div className="container flex items-center justify-center text-center text-sm md:text-base font-medium relative z-10">
                <Sparkles className="w-4 h-4 text-brand-mustard mr-2 animate-pulse" />
                <span>
                    Free shipping on orders over $50! Use code <span className="text-brand-mustard font-bold mx-1">FREESHIP</span> at checkout.
                </span>
                <Sparkles className="w-4 h-4 text-brand-mustard ml-2 animate-pulse" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                    onClick={handleDismiss}
                    aria-label="Dismiss announcement"
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useFeaturedProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";

export function Hero() {
  const { data: products, isLoading } = useFeaturedProducts();

  // Track which product index each card shows
  const [cardIndices, setCardIndices] = useState([0, 1, 2]);
  const [fadingCard, setFadingCard] = useState<number | null>(null);
  const [positionMap, setPositionMap] = useState([0, 1, 2]);

  const rotateCard = useCallback(
    (cardPosition: number) => {
      if (!products || products.length <= 3) return;

      setFadingCard(cardPosition);

      setTimeout(() => {
        setCardIndices((prev) => {
          const newIndices = [...prev];
          let nextIndex = (prev[cardPosition] + 3) % products.length;
          while (prev.includes(nextIndex) && products.length > 3) {
            nextIndex = (nextIndex + 1) % products.length;
          }
          newIndices[cardPosition] = nextIndex;
          return newIndices;
        });
        // Pick a random permutation of [0,1,2] different from the current one
        setPositionMap((prev) => {
          const all = [
            [0, 1, 2], [0, 2, 1], [1, 0, 2],
            [1, 2, 0], [2, 0, 1], [2, 1, 0],
          ];
          const others = all.filter((p) => p.some((v, i) => v !== prev[i]));
          return others[Math.floor(Math.random() * others.length)];
        });
      }, 300);

      setTimeout(() => setFadingCard(null), 350);
    },
    [products],
  );

  // Independent timers for each card
  useEffect(() => {
    if (!products || products.length <= 3) return;

    const timer1 = setInterval(() => rotateCard(0), 20000); // 20 seconds
    const timer2 = setInterval(() => rotateCard(1), 25000); // 25 seconds
    const timer3 = setInterval(() => rotateCard(2), 30000); // 30 seconds

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, [products, rotateCard]);

  const getProduct = (cardPosition: number) => {
    if (!products || products.length === 0) return null;
    const index = cardIndices[cardPosition] % products.length;
    return products[index];
  };

  return (
    <section className="relative min-h-[75vh] flex items-center pt-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-brand-cream-dark to-brand-kraft" />

      {/* Decorative circles */}
      <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-radial from-brand-berry/[0.08] to-transparent pointer-events-none" />
      <div className="absolute -bottom-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-radial from-brand-olive/[0.08] to-transparent pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <div className="max-w-xl animate-fade-in-up">
            {/* Tagline */}
            <div className="flex items-center gap-4 mb-6">
              <span className="w-10 h-0.5 bg-brand-berry rounded-full" />
              <span className="font-script text-xl md:text-2xl text-brand-berry">
                Cold-Pressed Happiness
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-brand-brown mb-6 leading-tight">
              Nourish Your Body,{" "}
              <span className="relative inline-block text-brand-olive">
                Elevate Your Day
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-brand-mustard/40 -z-10 rounded-full" />
              </span>
            </h1>

            {/* Geo subtitle */}
            <p className="text-base text-brand-terracotta font-medium mb-4">
              Fresh Cold-Pressed Juices in Portsmouth, VA
            </p>

            {/* Description */}
            <p className="text-lg text-brand-warm-gray mb-8 max-w-md">
              Fresh, cold-pressed juices crafted daily with love. No additives,
              no preservatives — just pure, vibrant nutrition in every sip.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 bg-brand-berry hover:bg-brand-berry-dark shadow-berry text-base font-semibold tracking-wide transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <Link to="/products">
                  Explore Menu
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 border-2 border-brand-olive text-brand-olive hover:bg-brand-olive hover:text-white text-base font-semibold tracking-wide transition-all hover:-translate-y-1"
              >
                <Link to="/about">Our Story</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-semibold text-brand-brown">
                  100%
                </div>
                <div className="text-sm text-brand-warm-gray mt-1">
                  Fresh Produce
                </div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-semibold text-brand-brown">
                  24
                </div>
                <div className="text-sm text-brand-warm-gray mt-1">
                  Unique Blends
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Background circle */}
              <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-brand-cream-dark to-brand-terracotta opacity-30" />

              {/* Floating juice cards - rotate product AND position independently */}
              {isLoading ? (
                <>
                  <Skeleton className="absolute top-[10%] left-[5%] w-36 h-48 rounded-lg" />
                  <Skeleton className="absolute top-[45%] right-0 w-36 h-48 rounded-lg" />
                  <Skeleton className="absolute bottom-[5%] left-[15%] w-36 h-48 rounded-lg" />
                </>
              ) : (
                <>
                  {([0, 1, 2] as const).map((cardNum) => {
                    const product = getProduct(cardNum);
                    if (!product) return null;
                    const posSlot = positionMap[cardNum];
                    const isFading = fadingCard === cardNum;
                    const posStyle: React.CSSProperties =
                      posSlot === 0
                        ? { top: "10%", left: "5%", zIndex: 10 }
                        : posSlot === 1
                          ? { top: "45%", left: "calc(100% - 9rem)", zIndex: 20 }
                          : { top: "58%", left: "15%", zIndex: 30 };
                    return (
                      <Link
                        key={cardNum}
                        to={`/products/${product.slug}`}
                        style={{
                          position: "absolute",
                          width: "9rem",
                          transition: "top 0.6s ease, left 0.6s ease, opacity 0.3s, transform 0.3s",
                          opacity: isFading ? 0 : 1,
                          transform: isFading ? "scale(0.95)" : "scale(1)",
                          ...posStyle,
                        }}
                        className="bg-card rounded-lg p-2.5 shadow-lifted hover:shadow-xl"
                      >
                        <div className="aspect-[4/5] rounded overflow-hidden mb-2">
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-display text-sm text-charcoal truncate">
                          {product.name}
                        </div>
                        <div className="text-[10px] tracking-[0.1em] uppercase text-taupe">
                          {posSlot === 0 ? "Signature Elixir" : posSlot === 1 ? "Energizing" : "Antioxidant"}
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

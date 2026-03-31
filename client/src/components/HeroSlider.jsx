import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { useHeroSliderStore } from "../store/useHeroSliderStore";

export default function HeroSlider() {
  const { slider, loading, fetchSlider } = useHeroSliderStore();

  useEffect(() => {
    fetchSlider();
  }, [fetchSlider]);

  const hasImages = slider?.images && slider.images.length > 0;

  return (
    <section className="relative w-full h-[15vh] md:h-[70vh] overflow-hidden text-white">
      {/* ===== BACKGROUND SLIDER ===== */}
      {hasImages && (
        <div className="absolute inset-0 z-0">
          <Swiper
            modules={[Autoplay, EffectFade]}
            slidesPerView={1}
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            className="w-full h-full"
          >
            {slider.images.map((img, idx) => (
              <SwiperSlide key={idx}>
                <div
                  className="w-full h-full bg-contain bg-center bg-no-repeat bg-black"
                  style={{
                    backgroundImage: `url(${
                      typeof img === "string" ? img : img.url
                    })`,
                  }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* ===== LOADING ===== */}
      {loading && (
        <div className="absolute bottom-5 right-5 z-20 text-sm text-gray-300">
          Loading images...
        </div>
      )}
    </section>
  );
}

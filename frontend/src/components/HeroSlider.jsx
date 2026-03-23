import { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import { useNavigate } from "react-router-dom";
import { useHeroSliderStore } from "../store/useHeroSliderStore";

export default function HeroSlider({ setShowModal }) {
  const navigate = useNavigate();
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

      {/* ===== DARK OVERLAY ===== */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* ===== TOP NAV ===== */}
      <div className="absolute right-5 top-5 z-50 flex flex-wrap gap-2 sm:gap-3 md:gap-4 font-bold text-md justify-end">
        <button
          className="cursor-pointer px-3 py-1 text-white text-[12px] md:text-sm font-medium tracking-wide
    backdrop-blur-md bg-black/40 border border-white/20
    rounded-full hover:bg-black/60 hover:text-red-300
    transition duration-300"
          onClick={() => navigate("/slide-images")}
        >
          Slide Images
        </button>

        <button
          onClick={() => setShowModal(true)}
          className="cursor-pointer px-3 py-1 text-white text-[12px] md:text-sm font-medium tracking-wide
    backdrop-blur-md bg-black/40 border border-white/20
    rounded-full hover:bg-black/60 hover:text-red-300
    transition duration-300"
        >
          + Create Diary
        </button>

        <button
          onClick={() => navigate("/timeline")}
          className="cursor-pointer px-3 py-1 text-white text-[12px] md:text-sm font-medium tracking-wide
    backdrop-blur-md bg-black/40 border border-white/20
    rounded-full hover:bg-black/60 hover:text-red-300
    transition duration-300"
        >
          Timeline
        </button>

        <a
          href="https://marudhararts.com/contact"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h1
            className="cursor-pointer px-3 py-1 text-white text-[12px] md:text-sm font-medium tracking-wide
      backdrop-blur-md bg-black/40 border border-white/20
      rounded-full hover:bg-black/60 hover:text-red-300
      transition duration-300"
          >
            Contact
          </h1>
        </a>

        <h1
          className="cursor-pointer px-3 py-1 text-white text-[12px] md:text-sm font-medium tracking-wide
    backdrop-blur-md bg-black/40 border border-white/20
    rounded-full hover:bg-black/60 hover:text-red-300
    transition duration-300"
          onClick={() => navigate("/about")}
        >
          About
        </h1>
      </div>

      {/* ===== HERO CONTENT ===== */}
      {/* <div className="relative z-20 max-w-6xl mx-auto text-center px-4 h-full flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="p-2 rounded-2xl bg-white shadow-xl">
            <img
              src="/download.png"
              className="h-16 w-16 object-contain"
              alt="logo"
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            My Diary
          </h1>
        </div>

        <p className="text-gray-300 text-base md:text-lg max-w-2xl">
          Capture your thoughts, relive your moments, and preserve your memories
          in a clean, beautiful timeline.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition shadow-md"
          >
            + Create Diary
          </button>

          <button
            onClick={() => navigate("/timeline")}
            className="px-5 py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition"
          >
            Add Timeline
          </button>
        </div>
      </div> */}

      {/* ===== LOADING ===== */}
      {loading && (
        <div className="absolute bottom-5 right-5 z-20 text-sm text-gray-300">
          Loading images...
        </div>
      )}
    </section>
  );
}

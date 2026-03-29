import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/effect-fade";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useHeroSliderStore } from "../store/useHeroSliderStore";

export default function HeroSlider() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
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
      <div className="absolute right-5 top-5 z-50">
        {/* Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative flex flex-col justify-center items-center w-10 h-10
    backdrop-blur-md bg-black/40 border border-white/20 rounded-full
    hover:bg-black/60 transition duration-300"
        >
          {/* Lines */}
          <span
            className={`absolute w-5 h-[2px] bg-white transition-all duration-300 ${
              menuOpen ? "rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`absolute w-5 h-[2px] bg-white transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute w-5 h-[2px] bg-white transition-all duration-300 ${
              menuOpen ? "-rotate-45" : "translate-y-1.5"
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 mt-3 w-52 origin-top-right transform transition-all duration-300 ${
            menuOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          <div
            className="flex flex-col gap-2 p-4 rounded-2xl
      bg-black/70 backdrop-blur-xl justify-center border border-white/10 shadow-2xl"
          >
            <button
              onClick={() => {
                navigate("/slide-images");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:translate-x-[-2px]"
            >
              Slide Images
            </button>

            <button
              // onClick={() => {
              //   setShowModal(true);
              //   setMenuOpen(false);
              // }}
              onClick={() => {
                navigate("/addCard");
                setMenuOpen(false)
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:translate-x-[-2px]"
            >
              + Create Diary
            </button>

            <button
              onClick={() => {
                navigate("/timeline");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:translate-x-[-2px]"
            >
              Timeline
            </button>

            <a
              href="https://marudhararts.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:translate-x-[-2px]"
            >
              Contact
            </a>

            <button
              onClick={() => {
                navigate("/about");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:translate-x-[-2px]"
            >
              About
            </button>
          </div>
        </div>
      </div>

      {/* ===== LOADING ===== */}
      {loading && (
        <div className="absolute bottom-5 right-5 z-20 text-sm text-gray-300">
          Loading images...
        </div>
      )}
    </section>
  );
}

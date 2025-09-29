import Image from "next/image";
import Navbar from "./Navbar"
import navItems  from "./navIcon";
import Styles from "./home.module.css";
import OfferCard from "./OfferCard";
import OffersSwiper from "./OffersSwiper";
import HeroCarousel from "./HeroCarousel";
import CardGrid from "./CardGrid";
import CardGridStyle from "./CardGrid.module.css";
import Animation from "./tailwind.config"
import Train from "./train/page";
import "./globals.css";
import Bus from "./bus/page";
import LoginPage from "./login/login";
import About from "./about/page";
import Hotel from "./hotel/page";
import TripBudgetPlanner from "./budgets/trim/page";


export default function HomePage(): JSX.Element {
  return (
    <>
      <Navbar />
      <div className={Styles.horizontalScroll}>
        {/* Section 1: Welcome */}
        <section className="hero-section">
        <section className={Styles.scrollSection}>
          
           
          <h1 className="text-center text-white text-6xl sm:text-7xl md:text-8xl lg:text-[20rem] font-bold mt-20">
  Welcome to our Travel App
</h1>

<p className="text-center text-white text-lg mt-4">
  Select an option from the navigation above to get started.
</p>

        </section>
        </section>

        {/* Section 2: Explore Destinations */}
        <section className={Styles.scrollSection}>
          <p className="text-center text-arish-500 text-lg animate-fadeInOut">Explore Destinations</p>
  <CardGrid />
  
         
          
        </section>
      </div>
    </>
  );
}
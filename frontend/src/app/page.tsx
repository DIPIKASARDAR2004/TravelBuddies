import Styles from "./home.module.css";
import CardGrid from "./CardGrid";

export default function HomePage() {
  return (
    <div className={Styles.horizontalScroll}>
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

      <section className={Styles.scrollSection}>
        <p className="text-center text-arish-500 text-lg animate-fadeInOut">
          Explore Destinations
        </p>
        <CardGrid />
      </section>
    </div>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Reviews from "@/components/Reviews";
import Configurator from "@/components/Configurator";
import Shotjesbar from "@/components/Shotjesbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Reviews />
        <Configurator />
        <Shotjesbar />
      </main>
      <Footer />
    </>
  );
}

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features, HowItWorks } from "./components/Features";
import { ReportPreview, WorkspacePreview } from "./components/Previews";
import { ForCompanies, Pricing } from "./components/Business";
import { MobileApp } from "./components/MobileApp";
import { FinalCta, Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-electric">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <HowItWorks />
        <WorkspacePreview />
        <ReportPreview />
        <MobileApp />
        <ForCompanies />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

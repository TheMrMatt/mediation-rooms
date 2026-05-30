import { Header } from "../components/landing/header";
import { Hero } from "../components/landing/hero";
import { ProblemSection } from "../components/landing/problem-section";
import { ProductExplanation } from "../components/landing/product-explanation";
import { HowItWorks } from "../components/landing/how-it-works";
import { IntegrationTabs } from "../components/landing/integration-tabs";
import { ArkivSection } from "../components/landing/arkiv-section";
import { StatesSection } from "../components/landing/states-section";
import { UseCases } from "../components/landing/use-cases";
import { DemoSection } from "../components/landing/demo-section";
import { FinalCTA, Footer } from "../components/landing/final-cta";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <ProductExplanation />
        <HowItWorks />
        <IntegrationTabs />
        <ArkivSection />
        <StatesSection />
        <UseCases />
        <DemoSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

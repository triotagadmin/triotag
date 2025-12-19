import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto prose prose-invert">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Terms of Service
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using Tiny Sticky Ads ("the Platform"), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              Tiny Sticky Ads is a micro-advertising marketplace that connects advertisers with venues, 
              agents, and digital publishers. We provide a platform for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Advertisers to find and book advertising spaces</li>
              <li>Venue publishers to list physical advertising locations</li>
              <li>Agent publishers to offer promotional services</li>
              <li>Digital publishers to provide digital advertising inventory</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. User Conduct</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Upload harmful content or malware</li>
              <li>Interfere with the proper functioning of the Platform</li>
              <li>Attempt to gain unauthorized access to any systems</li>
              <li>Use the Platform for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Advertiser Terms</h2>
            <p className="text-muted-foreground mb-4">
              As an advertiser, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Ensure all advertising content complies with applicable laws</li>
              <li>Not submit content that is defamatory, obscene, or offensive</li>
              <li>Own or have rights to all submitted creative materials</li>
              <li>Pay for all services and products ordered through the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Publisher Terms</h2>
            <p className="text-muted-foreground mb-4">
              As a publisher (venue, agent, or digital), you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Provide accurate descriptions of your advertising inventory</li>
              <li>Fulfill all bookings and commitments made through the Platform</li>
              <li>Maintain the quality and availability of listed spaces/services</li>
              <li>Comply with all verification requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Payments and Fees</h2>
            <p className="text-muted-foreground mb-4">
              All payments are processed through our secure payment system. Fees and commissions 
              are disclosed at the time of transaction. Refunds are subject to our refund policy 
              and the specific terms of each transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The Platform and its original content, features, and functionality are owned by 
              Tiny Sticky Ads and are protected by international copyright, trademark, and other 
              intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the maximum extent permitted by law, Tiny Sticky Ads shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including loss of 
              profits, data, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-4">
              The Platform is provided "as is" and "as available" without warranties of any kind, 
              either express or implied. We do not guarantee that the service will be uninterrupted, 
              secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may terminate or suspend your account and access to the Platform at our sole 
              discretion, without prior notice, for conduct that we believe violates these Terms 
              or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the 
              jurisdiction in which Tiny Sticky Ads operates, without regard to its conflict of 
              law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any 
              material changes by posting the new Terms on this page. Your continued use of the 
              Platform after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Contact Information</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:contact@tinysticky.ads" className="text-primary hover:underline">contact@tinysticky.ads</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;

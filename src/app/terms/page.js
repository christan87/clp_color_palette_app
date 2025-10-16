import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 prose prose-purple dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing and using ColorPal ("the Service"), you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Use License</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Permission is granted to temporarily access and use the Service for personal, non-commercial purposes. 
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">User Accounts</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. 
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of 
              your account on our Service.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You are responsible for safeguarding the password that you use to access the Service and for any 
              activities or actions under your password. You agree not to disclose your password to any third party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">User Content</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our Service allows you to create, store, and share color palettes. You retain all rights to any content 
              you submit, post or display on or through the Service. By making any content available through the Service, 
              you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content 
              solely for the purpose of providing the Service to you.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You are solely responsible for your content and the consequences of posting or publishing it. You represent 
              and warrant that you own or have the necessary rights to use your content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Prohibited Uses</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li>Use the Service in any way that violates any applicable national or international law or regulation</li>
              <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
              <li>Impersonate or attempt to impersonate the Company, another user, or any other person or entity</li>
              <li>Introduce any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful</li>
              <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Service and its original content (excluding user-generated content), features, and functionality are 
              and will remain the exclusive property of ColorPal and its licensors. The Service is protected by copyright, 
              trademark, and other laws. Our trademarks may not be used in connection with any product or service without 
              our prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Privacy and Data Protection</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy, which 
              explains how we collect, use, and disclose information that pertains to your privacy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Disclaimer of Warranties</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties 
              of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, 
              fitness for a particular purpose, non-infringement, or course of performance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              In no event shall ColorPal, nor its directors, employees, partners, agents, suppliers, or affiliates, be 
              liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
              loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or 
              inability to access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Termination</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or 
              liability, under our sole discretion, for any reason whatsoever and without limitation, including but not 
              limited to a breach of the Terms.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you wish to terminate your account, you may simply discontinue using the Service or contact us to request 
              account deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision 
              is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes 
              a material change will be determined at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Governing Law</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These Terms shall be governed and construed in accordance with the laws of your jurisdiction, without regard 
              to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about these Terms, please contact us through our website or via email.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

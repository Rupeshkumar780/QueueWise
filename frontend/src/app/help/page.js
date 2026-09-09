import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Help Center | QueueWise',
};

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I join a queue?",
      answer: "Scan the business's QR code or visit their QueueWise link. You may need to grant location access if the business requires you to be nearby. Follow the prompts to enter your details and secure your spot."
    },
    {
      question: "Why is it asking for my location?",
      answer: "Some businesses enforce a 'geofence' to ensure customers are physically nearby (e.g. outside the Hospital Counter) before they can join the queue. Your location is only used once to verify your distance and is not continuously tracked."
    },
    {
      question: "How will I know when it's my turn?",
      answer: "You can keep your browser tab open to watch the live queue status. We will also update your screen immediately when you are called to the counter."
    },
    {
      question: "Can I manage multiple queues as a business?",
      answer: "Yes! The business dashboard allows you to create multiple services (like 'Consultation' or 'Billing') and assign different staff counters to handle them simultaneously."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Help Center</h1>
          <p className="text-lg text-gray-500 mb-10">Frequently asked questions and support.</p>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">Our support team is always ready to assist you.</p>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=queuewise.support@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


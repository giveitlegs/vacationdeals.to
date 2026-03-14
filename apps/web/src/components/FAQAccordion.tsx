interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
  title?: string;
}

export function FAQAccordion({
  faqs,
  title = "Frequently Asked Questions",
}: FAQAccordionProps) {
  return (
    <div className="faq-accordion rounded-xl border border-gray-200 bg-white">
      <h2 className="px-6 pt-6 pb-2 text-2xl font-bold text-gray-900">
        {title}
      </h2>
      <div className="divide-y divide-gray-100">
        {faqs.map((faq, index) => (
          <details key={index} className="faq-item group">
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-medium text-gray-900 select-none">
              <span className="pr-4">{faq.question}</span>
              <span className="faq-chevron ml-auto shrink-0 text-gray-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="faq-content">
              <div>
                <p className="px-6 pb-4 text-sm leading-relaxed text-gray-600">
                  {faq.answer}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

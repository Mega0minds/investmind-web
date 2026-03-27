"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is InvestMind?",
    answer:
      "InvestMind connects youth innovators across Africa with investors, mentors, and a supportive community so great ideas get the funding, guidance, and exposure they need to grow.",
  },
  {
    question: "Who can join?",
    answer:
      "Innovators with an idea or early-stage venture, and investors or mentors who want to support talent in Africa can sign up and get started.",
  },
  {
    question: "How do I get started?",
    answer:
      "Click Get Started, create your account, and complete your profile. You can then explore opportunities, apply for funding, or connect with mentors.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question} className="rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between text-left"
              aria-expanded={isOpen}
            >
              <span
                className="text-sm sm:text-base md:text-lg font-semibold"
                style={{ color: "#4A4A4A" }}
              >
                {item.question}
              </span>
              <span
                className={`ml-4 text-lg leading-none transition-transform duration-200 ${
                  isOpen ? "rotate-45" : "rotate-0"
                }`}
                style={{ color: "#4A4A4A" }}
                aria-hidden
              >
                +
              </span>
            </button>

            {isOpen && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                <p
                  className="text-xs sm:text-sm md:text-base leading-relaxed"
                  style={{ color: "#6B7280" }}
                >
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

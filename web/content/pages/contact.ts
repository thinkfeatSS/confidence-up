export const contactSubjects = [
  { value: 'general', label: 'General inquiry' },
  { value: 'support', label: 'Support' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'press', label: 'Press & media' },
] as const;

export const contactContent = {
  hero: {
    title: 'We would love to hear from you.',
    subtitle:
      'Questions about SpeakUpMic, partnerships, press, or support — our team at ThinkFeat is here to help.',
  },
  info: {
    emailLabel: 'Email us',
    responseLabel: 'Response time',
    privacyNote: 'By submitting this form, you agree to our Privacy Policy. We never share your details with third parties.',
  },
  faqs: [
    {
      question: 'How do I contact SpeakUpMic?',
      answer:
        'You can reach the SpeakUpMic team by emailing info@thinkfeat.com or using the contact form on this page. We respond within 2 business days.',
    },
    {
      question: 'How do I report a bug or get app support?',
      answer:
        'Select "Support" in the contact form and describe the issue, including your device type and app version. Our team will follow up promptly.',
    },
  ],
};

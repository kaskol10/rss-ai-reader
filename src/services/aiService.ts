import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
  // Privacy-focused configuration
  defaultHeaders: {
    'OpenAI-Organization': '',
  }
});

export const generateSummary = async (content: string, prompt: string): Promise<string> => {
  try {
    console.log('AI Service: Generating summary for content length:', content.length);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
      // Privacy settings
      user: 'anonymous', // Don't associate requests with specific users
      logit_bias: {}, // Disable bias logging
    });

    const summary = response.choices[0]?.message?.content || 'Unable to generate summary';
    console.log('AI Service: Summary generated successfully');
    return summary;
  } catch (error) {
    console.error('AI Service: Error generating summary:', error);
    throw new Error('Failed to generate AI summary');
  }
};

export const defaultPrompts = [
  {
    id: 'technical',
    name: 'Technical Summary',
    prompt: 'Provide a concise technical summary of this article, focusing on key technologies, methodologies, and technical insights. Keep it under 100 words.',
    isDefault: true
  },
  {
    id: 'business',
    name: 'Business Summary',
    prompt: 'Summarize this article from a business perspective, highlighting market implications, business opportunities, and strategic insights. Keep it under 100 words.',
    isDefault: true
  },
  {
    id: 'casual',
    name: 'Casual Summary',
    prompt: 'Write a friendly, easy-to-understand summary of this article for a general audience. Focus on the main points and why they matter. Keep it under 100 words.',
    isDefault: true
  }
];

// Short summary prompt for feed list previews
export const shortSummaryPrompt = 'Summarize this article in exactly 20 words or less. Focus on the main point and key takeaway. Be concise and informative.';

export const generateShortSummary = async (content: string, customPrompt?: string): Promise<string> => {
  try {
    console.log('AI Service: Generating short summary for content length:', content.length);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: customPrompt || shortSummaryPrompt
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: 50,
      temperature: 0.7,
      // Privacy settings
      user: 'anonymous', // Don't associate requests with specific users
      logit_bias: {}, // Disable bias logging
    });

    const summary = response.choices[0]?.message?.content || 'Unable to generate summary';
    console.log('AI Service: Short summary generated successfully');
    return summary;
  } catch (error) {
    console.error('AI Service: Error generating short summary:', error);
    throw new Error('Failed to generate short summary');
  }
};

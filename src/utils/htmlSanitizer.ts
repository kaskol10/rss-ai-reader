// Simple HTML sanitizer for RSS content
// This is a basic implementation - in production, consider using a library like DOMPurify

export const sanitizeHTML = (html: string): string => {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove potentially dangerous elements
  const dangerousTags = ['script', 'object', 'embed', 'iframe', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });
  
  // Remove dangerous attributes
  const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'style'];
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(el => {
    dangerousAttributes.forEach(attr => {
      el.removeAttribute(attr);
    });
  });
  
  return tempDiv.innerHTML;
};

export const stripHTML = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

"use client";

import { useEffect, useRef } from 'react';

export default function DynamicContent({ content }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      // Get all elements inside the content
      const allElements = contentRef.current.querySelectorAll('*');
      
      // Force remove all inline styles that could cause word breaking
      allElements.forEach(element => {
        // Remove style attribute completely
        element.removeAttribute('style');
        element.removeAttribute('class');
        
        // Force our CSS properties via inline styles (overrides everything)
        element.style.wordBreak = 'normal';
        element.style.overflowWrap = 'break-word';
        element.style.wordWrap = 'break-word';
        element.style.whiteSpace = 'normal';
        element.style.maxWidth = '100%';
      });
    }
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="slug-content"
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
}

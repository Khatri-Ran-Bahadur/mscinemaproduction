"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ReadMoreContent({ content, maxHeightPercentage = 50 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      const fullHeight = contentRef.current.scrollHeight;
      const calculatedHeight = (fullHeight * maxHeightPercentage) / 100;
      setCollapsedHeight(calculatedHeight);
      
      // Only show button if content is taller than the collapsed height
      setShowButton(fullHeight > calculatedHeight + 50); // 50px threshold
    }
  }, [content, maxHeightPercentage]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className="prose prose-invert max-w-none text-[#D3D3D3] leading-relaxed text-lg prose-p:mb-4 prose-headings:text-[#FFCA20] w-full overflow-hidden break-words [&>img]:max-w-full [&>img]:h-auto transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isExpanded ? 'none' : `${collapsedHeight}px`,
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      {/* Read More/Less Link */}
      {showButton && (
        <div className="mt-8">
          <a
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 text-[#FFCA20] hover:text-[#ffda50] cursor-pointer font-semibold text-lg transition-colors duration-200 group"
          >
            <span className="underline decoration-2 underline-offset-4 decoration-[#FFCA20]/50 group-hover:decoration-[#FFCA20] transition-all">
              {isExpanded ? 'Read Less' : 'Read More'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            ) : (
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            )}
          </a>
        </div>
      )}
    </div>
  );
}

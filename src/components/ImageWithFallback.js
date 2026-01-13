'use client';

import React, { useState } from 'react';

export default function ImageWithFallback({ src, fallbackSrc, alt, className, ...props }) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            className={className}
            onError={() => {
                if (imgSrc !== fallbackSrc) {
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}

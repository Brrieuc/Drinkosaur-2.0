import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    url,
    type = 'website'
}) => {
    const siteTitle = 'Drinkosaur';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
    const defaultDescription = "Drinkosaur vous aide à suivre votre consommation d'alcool et estimer votre taux d'alcoolémie en temps réel. Restez en sécurité.";
    const metaDescription = description || defaultDescription;
    const defaultImage = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3GwalK-_8qkiqtJ9wxjVPg7C3VGn-slPe3XK-DNhm4iSq2f0VBeOEjanUW_uoncmzZu74szYMJhs_o8xYV0RU3g-HZTflVBgh9Tj8wSy43r1MiQrgyrp8HIQJyP6wBQu5bT5tFCrLhskSvzeL8flCHnZ6T-7kheSEkcwm6fQuSGZE-LKrBq6KbB_pg4k/s16000/drinkosaur.png";
    const metaImage = image || defaultImage;
    const metaUrl = url || 'https://drinkosaur.web.app/';

    return (
        <Helmet>
            {/* Basic */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={metaUrl} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
};

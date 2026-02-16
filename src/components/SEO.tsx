import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    canonical?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    url,
    type = 'website',
    canonical
}) => {
    const siteTitle = 'Drinkosaur';
    const fullTitle = title ? `${title} | ${siteTitle}` : 'Drinkosaur - Ethylotest & Calculateur d\'Alcoolémie';
    const defaultDescription = "Drinkosaur est le meilleur calculateur d'alcoolémie et éthylotest en ligne gratuit. Suivez votre consommation d'alcool en temps réel.";
    const metaDescription = description || defaultDescription;
    const defaultImage = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3GwalK-_8qkiqtJ9wxjVPg7C3VGn-slPe3XK-DNhm4iSq2f0VBeOEjanUW_uoncmzZu74szYMJhs_o8xYV0RU3g-HZTflVBgh9Tj8wSy43r1MiQrgyrp8HIQJyP6wBQu5bT5tFCrLhskSvzeL8flCHnZ6T-7kheSEkcwm6fQuSGZE-LKrBq6KbB_pg4k/s16000/drinkosaur.png";
    const metaImage = image || defaultImage;
    const metaUrl = url || 'https://mydrinkosaur.web.app/';

    return (
        <Helmet>
            {/* Basic */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            {canonical && <link rel="canonical" href={canonical} />}

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

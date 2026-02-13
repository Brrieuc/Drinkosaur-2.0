
export interface AwardDefinition {
    id: string;
    name: string;
    name_fr: string;
    description: string;
    description_fr: string;
    imageUrl: string;
    /** Which stat category determines this award */
    category: AwardCategory;
}

export type AwardCategory =
    | 'most_rum'
    | 'most_shots'
    | 'most_vodka'
    | 'most_party_days'
    | 'highest_peak_bac'
    | 'longest_drunk_duration'
    | 'most_wine'
    | 'most_chugs'
    | 'most_champagne'
    | 'most_beer'
    | 'most_gin'
    | 'least_drinks'
    | 'most_tequila'
    | 'most_whisky';

export interface ComputedAward {
    awardId: string;
    recipientUid: string;
    recipientName: string;
    recipientPhoto: string;
    value: number | string; // The stat value (e.g. "12 drinks", "3.2 g/L")
    month: number; // 0-indexed month
    year: number;
}

export const AWARD_DEFINITIONS: AwardDefinition[] = [
    {
        id: 'rhumosaur',
        name: 'Rhumosaur',
        name_fr: 'Rhumosaur',
        description: 'Player who drank the most rum',
        description_fr: 'Le joueur ayant bu le plus de rhum',
        imageUrl: '/awards/Rhumosaur.png',
        category: 'most_rum',
    },
    {
        id: 'shotausor',
        name: 'Shotausor',
        name_fr: 'Shotausor',
        description: 'Player who drank the most shots',
        description_fr: 'Le joueur ayant bu le plus de shots',
        imageUrl: '/awards/Shotausor.png',
        category: 'most_shots',
    },
    {
        id: 'vodkatausor',
        name: 'Vodkatausor',
        name_fr: 'Vodkatausor',
        description: 'Player who drank the most vodka',
        description_fr: 'Le joueur ayant bu le plus de vodka',
        imageUrl: '/awards/Vodkatosaur.png',
        category: 'most_vodka',
    },
    {
        id: 'partynausor',
        name: 'Partynausor',
        name_fr: 'Partynausor',
        description: 'Player who drank on the most different days',
        description_fr: 'Le joueur ayant bu le plus de jours différents',
        imageUrl: '/awards/Partynosaur.png',
        category: 'most_party_days',
    },
    {
        id: 'vomitosaur',
        name: 'Vomitosaur',
        name_fr: 'Vomitosaur',
        description: 'Player who reached the highest peak BAC',
        description_fr: 'Le joueur ayant atteint le plus haut pic d\'alcool',
        imageUrl: '/awards/Vomitosaur.png',
        category: 'highest_peak_bac',
    },
    {
        id: 'drunkosaur',
        name: 'Drunkosaur',
        name_fr: 'Drunkosaur',
        description: 'Player who stayed drunk the longest without sobering up',
        description_fr: 'Le joueur ayant fait la plus longue durée sans redevenir sobre',
        imageUrl: '/awards/Drunkosaur.png',
        category: 'longest_drunk_duration',
    },
    {
        id: 'winausor',
        name: 'Winausor',
        name_fr: 'Winausor',
        description: 'Player who drank the most wine',
        description_fr: 'Le joueur ayant bu le plus de vin',
        imageUrl: '/awards/Winosaur.png',
        category: 'most_wine',
    },
    {
        id: 'chugginosaur',
        name: 'Chugginosaur',
        name_fr: 'Chugginosaur',
        description: 'Player who chugged the most drinks',
        description_fr: 'Le joueur ayant fait le plus de cul-sec',
        imageUrl: '/awards/Chuginosaur.png',
        category: 'most_chugs',
    },
    {
        id: 'champagnosaur',
        name: 'Champagnosaur',
        name_fr: 'Champagnosaur',
        description: 'Player who drank the most champagne',
        description_fr: 'Le joueur ayant bu le plus de champagne',
        imageUrl: '/awards/Champagnosaur.png',
        category: 'most_champagne',
    },
    {
        id: 'beerosaur',
        name: 'Beerosaur',
        name_fr: 'Beerosaur',
        description: 'Player who drank the most beer',
        description_fr: 'Le joueur ayant bu le plus de bière',
        imageUrl: '/awards/Beerosaur.png',
        category: 'most_beer',
    },
    {
        id: 'gintosaur',
        name: 'Gintosaur',
        name_fr: 'Gintosaur',
        description: 'Player who drank the most gin',
        description_fr: 'Le joueur ayant bu le plus de gin',
        imageUrl: '/awards/Gintosaur.png',
        category: 'most_gin',
    },
    {
        id: 'sobrosaur',
        name: 'Sobrosaur',
        name_fr: 'Sobrosaur',
        description: 'Player who drank the least (or didn\'t drink at all)',
        description_fr: 'Le joueur ayant le moins bu / tout joueur n\'ayant pas bu',
        imageUrl: '/awards/Sobrosaur.png',
        category: 'least_drinks',
    },
    {
        id: 'tequilausor',
        name: 'Tequilausor',
        name_fr: 'Tequilausor',
        description: 'Player who drank the most tequila',
        description_fr: 'Le joueur ayant bu le plus de tequila',
        imageUrl: '/awards/Tequilausor.png',
        category: 'most_tequila',
    },
    {
        id: 'whiskosaur',
        name: 'Whiskosaur',
        name_fr: 'Whiskosaur',
        description: 'Player who drank the most whisky',
        description_fr: 'Le joueur ayant bu le plus de whisky',
        imageUrl: '/awards/Whiskosaur.png',
        category: 'most_whisky',
    },
];

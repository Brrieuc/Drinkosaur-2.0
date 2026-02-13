
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
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEinYKP3-bDTfV4WX3kjZ5MhqV55uk7AHPFUYKPOG67t5OMg1G7YHf1EflrBoaR7Eg9HoxptA0JCLTrzhMqeORBt5PAIi0tbDy0VkltGZv31c83pXRK3oqb7Nlnt_taPVsVfTFE_dd619LlUwL9VTEKItcHEBxE8CsbIpSpxF8Yg2z-wVgBMTGrq1GIdwHY/s320/Rhumosaur.png',
        category: 'most_rum',
    },
    {
        id: 'shotausor',
        name: 'Shotausor',
        name_fr: 'Shotausor',
        description: 'Player who drank the most shots',
        description_fr: 'Le joueur ayant bu le plus de shots',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiIiokHeNnu_I-y1xtBZd5bH1LLBMnUl-5owfA7O0QiE1XCiIvf5x2hFnVXQ1472u1nGwIyLgo_H_v1tfhYi9ec-wgx8QCo9i9oBId2k9kb4C0im6jvsvhZ4gUM795YQ8Xa1MqF-7HooSNPUWR4qvsNq5noeeMIUd9Wtzaw_ihb_Mc7kV2qVRrn8DeDJWE/s320/Shotausor.png',
        category: 'most_shots',
    },
    {
        id: 'vodkatausor',
        name: 'Vodkatausor',
        name_fr: 'Vodkatausor',
        description: 'Player who drank the most vodka',
        description_fr: 'Le joueur ayant bu le plus de vodka',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh-E_2CXn5xCSWFq08PJtTf8dJAXxqmq_XNP4EkfMSbuxLsUSNQfaIWe74PcO6eQvu6amDSnrbFxBxaUDZi3Xo23ydvXfJdfw94Vc2fWmbZ8PfiKOyN8BUTnmTis1e0ScrRwoy6cSqV5wAfuqwIdPynUETa3CqYm4ukrR9Ez1RlnOSxwB_ufrgyq-tOPaw/s320/Vodkatosaur.png',
        category: 'most_vodka',
    },
    {
        id: 'partynausor',
        name: 'Partynausor',
        name_fr: 'Partynausor',
        description: 'Player who drank on the most different days',
        description_fr: 'Le joueur ayant bu le plus de jours différents',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg-LNegfETzzUgsiNDTxAPDDuhOKpdMWrIg7ijRl_I2tZQMmK4j6Dtg7NB-2G4bMBhhKL0W5h9jjaUO5BZu-Apsh4gBtT8PcSgboe3TgKwTkaGtVzuuqwzlVz03uvT8B0KKr5OkX0Pqxrifu_7gP2hvpn-jD8bDFOsJmO9k53SrzLKnGyOOcXOKebvX6b0/s320/Partynosaur.png',
        category: 'most_party_days',
    },
    {
        id: 'vomitosaur',
        name: 'Vomitosaur',
        name_fr: 'Vomitosaur',
        description: 'Player who reached the highest peak BAC',
        description_fr: 'Le joueur ayant atteint le plus haut pic d\'alcool',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_go6CcwGmmGlKqMxaqRWhmeWvVPPGRo-0e8hK0lo8YaXcoyx9xPxOccul8jgX82NUQegbaN5-d2EFY2Yz1l446UQgvgAQCH8IsJBd_t29_hQ61PzQ1aaa1ix5rCX2lt_Yl6Ey9divgOEdRBMAJz-47tC6LsEbrkJaE4IAjwV6cgIYdet1IKxyraw4F4g/s320/Vomitosaur.png',
        category: 'highest_peak_bac',
    },
    {
        id: 'drunkosaur',
        name: 'Drunkosaur',
        name_fr: 'Drunkosaur',
        description: 'Player who stayed drunk the longest without sobering up',
        description_fr: 'Le joueur ayant fait la plus longue durée sans redevenir sobre',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi5aaZg9KtAlcKx-jHdlvKzX7s7oJVtIJo2ii6FoHMeI5OtcPlk3720AmX_9komex0f46COkoYMNWQHhgbXpr_pkd7woesJ8fzf-9tZ0AgoH5wWXDTf5kJwEttJdk9-DL-CmTyYZ3dVN_PkhYl1JK8vLXYnkA06cBCK6bzGkO2mo50pRrpT7qNVBvIE_3Q/s320/Drunkosaur.png',
        category: 'longest_drunk_duration',
    },
    {
        id: 'winausor',
        name: 'Winausor',
        name_fr: 'Winausor',
        description: 'Player who drank the most wine',
        description_fr: 'Le joueur ayant bu le plus de vin',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhH5YeFclXsoSwT47KUHjMfHIEr7grQKuowXroI3_7gxBrnEoUCl6fiLyjF-jaGZ4WqNps0YruQme-1nejTmqlGYuUfGGtfttCoRNSdlF7dHV0HbrY1D-KmHMHawMOerPG6wh1aS48U4wfiIj5ZJKtd5zD1ALQooRF98BpXtIKcP-_4OOhk4I4tLRcArdU/s832/Winosaur.png',
        category: 'most_wine',
    },
    {
        id: 'chugginosaur',
        name: 'Chugginosaur',
        name_fr: 'Chugginosaur',
        description: 'Player who chugged the most drinks',
        description_fr: 'Le joueur ayant fait le plus de cul-sec',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg7Kj2tychdAS6UKPwE7m6EHgnyyozvqOQ3z33HjhAZ06dlHRrD3QBMgPV4DrrhvIIhVuaJMEshuqpQWK04IYB9DubhLRgQNe3Qg8pOzdYcFaWaVsyEEAlcT4IdUnmECHw4uzBapFtxVqgM8o-1wtQ1qQJ2x4SK29YB9m5TClFxsH4uNlhAPWxgKBuHWTw/s320/Chuginosaur.png',
        category: 'most_chugs',
    },
    {
        id: 'champagnosaur',
        name: 'Champagnosaur',
        name_fr: 'Champagnosaur',
        description: 'Player who drank the most champagne',
        description_fr: 'Le joueur ayant bu le plus de champagne',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhr2_PPEcUNn6gsDBq44na5pSH9QL3lGR0-WNR2NnNH32xyc36HmkhwFlaWc_FIvmyrTycp67Y9XFsnWT0H2UvwgeyFM6lsDxB4jk5j6bbgsWxeMQPC2czFjMZFiz_nDg7xq_zQ-8_nBCLlJUj6gS9lDR1heQRzRaKwn_WiCezoSNOkBgCpyLx5-5pCmis/s320/Champagnosaur.png',
        category: 'most_champagne',
    },
    {
        id: 'beerosaur',
        name: 'Beerosaur',
        name_fr: 'Beerosaur',
        description: 'Player who drank the most beer',
        description_fr: 'Le joueur ayant bu le plus de bière',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiDGcorsAmxWY2WYHkpZ9HCILvv1r3M-eQdlZ_8lnS56ATrww8nxPRq8L82nDaBrCmCk4t7fiJ2b-G_0mBjmNXB0KQNCmCQasPgydpcwsuQ6LYpOcTrx_nc5AYHZGzzw32Sx9LiBobLjAx3wu8eQjYYQqYTdoz-OZYtrzClrDptoih_INPRaijHp7qTy_A/s320/Beerosaur.png',
        category: 'most_beer',
    },
    {
        id: 'gintosaur',
        name: 'Gintosaur',
        name_fr: 'Gintosaur',
        description: 'Player who drank the most gin',
        description_fr: 'Le joueur ayant bu le plus de gin',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgyfjSD3r30iTiEPOvOVBs6DPSacBrxIUqInaXCna6LH9ibt1CGHH088M13FcyFZxm9LNCAM_aBRNebBLb-LtxbGUowDcd5K_7R9Uk7VCr3OFwCYYWExrtZUSMkgdkjp9dLBTMWIpOx9iZPveJegxvit4FdUkXcFbbYEBG_LtZl1GbHldQa2mrTTdr3Pfw/s320/Gintosaur.png',
        category: 'most_gin',
    },
    {
        id: 'sobrosaur',
        name: 'Sobrosaur',
        name_fr: 'Sobrosaur',
        description: 'Player who drank the least (or didn\'t drink at all)',
        description_fr: 'Le joueur ayant le moins bu / tout joueur n\'ayant pas bu',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiCpJmdalDFUrYnK036KNGLEJcQ_0UjGrctNcdrC1e0YZ6gN3LUXBwff1WX5DzwfQl88tCj9fSu3z0DCPMKpVWsP_U9YSdCQGXK5Qc3xgmE47RUKwy2BWHipRfOUoXU9x9UeEb72GR0dpZdgQm4igBbySLeLjB1z6F5cy85ZnmxPvwD8PRqCy4eGS3jfCw/s320/Sobrosaur.png',
        category: 'least_drinks',
    },
    {
        id: 'tequilausor',
        name: 'Tequilausor',
        name_fr: 'Tequilausor',
        description: 'Player who drank the most tequila',
        description_fr: 'Le joueur ayant bu le plus de tequila',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2Zo3tqvJlXfbLT9HdpUurjHQcqCi6ITA0QpMq4d_0ESUK1hmhf8HdJsP-k4Uv4vxLwbcP7k-L2ER08TkxkL-JdaiVTUdJa6MekqbjFFL9s1XVmH8-1dg1tkw8653pOPH5Ymd7Bet4hkis0oBr4W4T6fT6dncH1xqOv9pGKBjV34M_l-V9rRq42kJm6M4/s320/Tequilausor.png',
        category: 'most_tequila',
    },
    {
        id: 'whiskosaur',
        name: 'Whiskosaur',
        name_fr: 'Whiskosaur',
        description: 'Player who drank the most whisky',
        description_fr: 'Le joueur ayant bu le plus de whisky',
        imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjX0ozeIfTUd2NmEqkRsBExgK3LBiA4SKxwzWLZbg1KS1q3pzSoMV6RDX8072mSd1anDPi92cIiBbcN0Hes0GCDQOCU2VtnWHYWromFPLrlsMfeSPw8I96tl1UbPUIvSlKh6-PEzJZQjfuXamBq2NI8t7Q36i-AOl_6-Kmh2OibizhRzzkfrJFDY7mamAI/s320/Whiskosaur.png',
        category: 'most_whisky',
    },
];

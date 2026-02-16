import { Zap, Calculator, Users, CheckCircle2, ChevronDown } from 'lucide-react';

interface LandingPageProps {
    language: 'en' | 'fr';
}

export const LandingPage: React.FC<LandingPageProps> = ({ language }) => {
    const isFrench = language === 'fr';

    const t = {
        heroTitle: isFrench ? "L'Éthylotest Intelligent & Gratuit" : "The Smart & Free BAC Calculator",
        heroSub: isFrench ? "Suivez votre consommation d'alcool en temps réel avec Drinkosaur. La web app d'alcoolémie conçue pour votre sécurité." : "Track your alcohol consumption in real-time with Drinkosaur. The BAC web app built for your safety.",
        whyTitle: isFrench ? "Pourquoi choisir Drinkosaur ?" : "Why choose Drinkosaur?",
        feature1Title: isFrench ? "Précision Scientifique" : "Scientific Accuracy",
        feature1Desc: isFrench ? "Calcul basé sur la formule de Widmark, prenant en compte votre poids, genre et type de boisson." : "Calculations based on the Widmark formula, factoring in weight, gender, and drink type.",
        feature2Title: isFrench ? "Social & Bienveillance" : "Social & Caring",
        feature2Desc: isFrench ? "Partagez votre état avec vos amis pour une soirée plus sûre pour tout le monde." : "Share your status with friends for a safer night out for everyone.",
        howTitle: isFrench ? "Comment fonctionne le calcul ?" : "How does the calculation work?",
        howText: isFrench
            ? "Drinkosaur utilise une version optimisée de la formule de Widmark. Le taux d'alcoolémie (BAC) est calculé en divisant la masse d'alcool pur consommé par le volume de distribution d'eau dans le corps (Poids × Constante de genre). Nous intégrons également un délai d'absorption de 45 minutes et un taux moyen d'élimination métabolique."
            : "Drinkosaur uses an optimized version of the Widmark formula. Blood Alcohol Content (BAC) is calculated by dividing the mass of pure alcohol consumed by the body's water distribution volume (Weight × Gender constant). We also factor in a 45-minute absorption delay and an average metabolic elimination rate.",
        faqTitle: isFrench ? "Foire Aux Questions" : "Frequently Asked Questions",
    };

    const faqs = [
        {
            q: isFrench ? "Drinkosaur remplace-t-il un éthylotest chimique ?" : "Does Drinkosaur replace a chemical breathalyzer?",
            a: isFrench
                ? "Non. Drinkosaur est un outil d'estimation mathématique. De nombreux facteurs (fatigue, alimentation, métabolisme individuel) peuvent influencer le taux réel. Ne conduisez jamais si vous avez bu."
                : "No. Drinkosaur is a mathematical estimation tool. Many factors (fatigue, food intake, individual metabolism) can influence the actual rate. Never drive after drinking."
        },
        {
            q: isFrench ? "L'application est-elle vraiment gratuite ?" : "Is the app really free?",
            a: isFrench
                ? "Oui, Drinkosaur est 100% gratuit. Nous finançons le service via des publicités solidaires dont une partie est reversée à des associations."
                : "Yes, Drinkosaur is 100% free. We fund the service through charity ads where a portion of revenue is donated to organizations."
        },
        {
            q: isFrench ? "Mes données sont-elles privées ?" : "Is my data private?",
            a: isFrench
                ? "Vos données de consommation sont stockées de manière sécurisée. Vous choisissez exactement quels amis peuvent voir votre état en temps réel."
                : "Your consumption data is stored securely. You choose exactly which friends can see your real-time status."
        }
    ];

    return (
        <div className="w-full flex flex-col gap-20 py-20 px-6 max-w-4xl mx-auto z-10">
            {/* Hero Section */}
            <header className="text-center space-y-6 animate-fade-in">
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white leading-tight">
                    {t.heroTitle.toUpperCase()}
                </h1>
                <p className="text-xl text-white/60 font-medium max-w-2xl mx-auto leading-relaxed">
                    {t.heroSub}
                </p>
                <div className="flex justify-center pt-8">
                    <ChevronDown className="text-white/20 animate-bounce" size={32} />
                </div>
            </header>

            {/* Features Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <h2 className="sr-only">{t.whyTitle}</h2>
                <div className="glass-panel-3d p-8 rounded-[32px] border-white/10 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                        <Calculator size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t.feature1Title}</h3>
                    <p className="text-white/50 leading-relaxed">{t.feature1Desc}</p>
                </div>
                <div className="glass-panel-3d p-8 rounded-[32px] border-white/10 space-y-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                        <Users size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{t.feature2Title}</h3>
                    <p className="text-white/50 leading-relaxed">{t.feature2Desc}</p>
                </div>
            </section>

            {/* How it works Section */}
            <section id="formula" className="glass-panel-3d p-10 rounded-[40px] border-white/10 space-y-8">
                <div className="flex items-center gap-4">
                    <Zap className="text-amber-400" />
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tight">{t.howTitle}</h2>
                </div>
                <p className="text-white/60 leading-relaxed text-lg italic">
                    {t.howText}
                </p>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 font-mono text-center">
                    <span className="text-white/40">BAC = [Alcohol(g) / (Weight(kg) * r)] / 10</span>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="space-y-10">
                <h2 className="text-3xl font-black italic text-center text-white uppercase tracking-tight">{t.faqTitle}</h2>
                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <article key={i} className="glass-panel-3d p-6 rounded-[24px] border-white/5 space-y-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                                {faq.q}
                            </h3>
                            <p className="text-white/50 pl-7 leading-relaxed font-medium">
                                {faq.a}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Final CTA Spacer for scrolling */}
            <footer className="text-center py-10 opacity-20 text-[10px] font-bold uppercase tracking-[0.4em]">
                Drinkosaur &copy; 2026 - Drink Responsibly
            </footer>
        </div>
    );
};

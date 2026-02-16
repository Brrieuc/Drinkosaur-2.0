import React from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, FileText, Info, Mail, ExternalLink } from 'lucide-react';

interface LegalModalProps {
    type: 'privacy' | 'terms' | 'about';
    onClose: () => void;
    language: 'en' | 'fr';
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, language }) => {
    const content = {
        fr: {
            privacy: {
                title: "Politique de Confidentialité",
                sections: [
                    {
                        h: "Collecte de données",
                        p: "Drinkosaur collecte des données minimales : votre poids, sexe, âge et vitesse de consommation pour estimer votre alcoolémie. Si vous vous connectez avec Google, nous récupérons votre email et photo de profil."
                    },
                    {
                        h: "Cookies & Publicités",
                        p: "Nous utilisons des cookies pour maintenir votre session. Google AdSense utilise également des cookies pour diffuser des annonces basées sur vos visites précédentes."
                    },
                    {
                        h: "Usage des données",
                        p: "Vos données ne sont JAMAIS vendues. Elles servent uniquement au fonctionnement de l'application et à la synchronisation cloud."
                    }
                ]
            },
            terms: {
                title: "Conditions Générales",
                sections: [
                    {
                        h: "Avertissement Médical",
                        p: "Les estimations d'alcoolémie fournies par Drinkosaur sont purement informatives et basées sur des algorithmes mathématiques. Elles ne remplacent JAMAIS un éthylotest certifié."
                    },
                    {
                        h: "Responsabilité",
                        p: "En utilisant cette application, vous acceptez que l'auteur ne soit pas responsable de vos décisions ou de votre conduite. Ne buvez pas si vous prévoyez de conduire."
                    },
                    {
                        h: "Âge Légal",
                        p: "L'utilisation de Drinkosaur est strictement réservée aux personnes majeures (18+)."
                    }
                ]
            },
            about: {
                title: "À Propos & Contact",
                sections: [
                    {
                        h: "Le Projet",
                        p: "Drinkosaur est un projet indépendant visant à promouvoir une consommation responsable via la connaissance de son propre corps."
                    },
                    {
                        h: "Contact",
                        p: "Pour toute question, demande de suppression de données ou suggestion, vous pouvez me contacter par email."
                    }
                ]
            }
        },
        en: {
            privacy: {
                title: "Privacy Policy",
                sections: [
                    {
                        h: "Data Collection",
                        p: "Drinkosaur collects minimal data: weight, gender, age, and drinking speed to estimate BAC. Google login provides email and profile photo."
                    },
                    {
                        h: "Cookies & Ads",
                        p: "We use cookies for session management. Google AdSense also uses cookies to serve ads based on your previous visits."
                    },
                    {
                        h: "Data Usage",
                        p: "Your data is NEVER sold. It is only used for app functionality and cloud sync."
                    }
                ]
            },
            terms: {
                title: "Terms & Conditions",
                sections: [
                    {
                        h: "Medical Disclaimer",
                        p: "BAC estimations provided by Drinkosaur are purely informative and based on mathematical algorithms. They NEVER replace a certified breathalyzer."
                    },
                    {
                        h: "Liability",
                        p: "By using this application, you agree that the author is not responsible for your decisions or conduct. Do not drink and drive."
                    },
                    {
                        h: "Legal Age",
                        p: "Usage of Drinkosaur is strictly reserved for adults (18+)."
                    }
                ]
            },
            about: {
                title: "About & Contact",
                sections: [
                    {
                        h: "The Project",
                        p: "Drinkosaur is an independent project aiming to promote responsible drinking through body awareness."
                    },
                    {
                        h: "Contact",
                        p: "For any questions, data deletion requests, or suggestions, you can contact me via email."
                    }
                ]
            }
        }
    }[language][type];

    const Icon = type === 'privacy' ? Shield : type === 'terms' ? FileText : Info;

    return createPortal(
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in pointer-events-auto">
            <div className="w-full max-w-md bg-[#0a0a0a] rounded-[40px] border border-white/10 shadow-2xl relative animate-scale-up max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden">

                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <Icon size={20} className="text-blue-400" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                            {content.title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition-colors shadow-lg"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {content.sections.map((s, i) => (
                        <div key={i} className="space-y-2">
                            <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                                {s.h}
                            </h4>
                            <p className="text-sm text-white/70 leading-relaxed font-medium">
                                {s.p}
                            </p>
                        </div>
                    ))}

                    {type === 'about' && (
                        <div className="space-y-4 pt-4">
                            <a
                                href="mailto:brieuc.pec@gmail.com"
                                className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                            >
                                <Mail size={18} className="text-white/30 group-hover:text-blue-400" />
                                <span className="text-sm font-bold text-white/60 group-hover:text-white">brieuc.pec@gmail.com</span>
                            </a>
                            <a
                                href="https://brieucpecqueraux.blogspot.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group"
                            >
                                <ExternalLink size={18} className="text-white/30 group-hover:text-amber-400" />
                                <span className="text-sm font-bold text-white/60 group-hover:text-white">Blog & Portfolio</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 text-center bg-white/[0.01]">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                        Drinkosaur &copy; 2026 - {language === 'fr' ? 'Consommez avec modération' : 'Drink responsibly'}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { X, Map as MapIcon, Info } from 'lucide-react';
import { Drink } from '../types';

interface HeatmapModalProps {
    drinks: Drink[];
    onClose: () => void;
    language?: 'en' | 'fr';
}

// Custom component to handle the heatmap layer
const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        // @ts-ignore - leaflet.heat adds heatLayer to L
        const heatLayer = (L as any).heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.4: 'blue',
                0.6: 'cyan',
                0.7: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
};

export const HeatmapModal: React.FC<HeatmapModalProps> = ({ drinks, onClose, language = 'en' }) => {
    const isFrench = language === 'fr';

    const t = {
        title: isFrench ? 'Heatmap Mondiale' : 'Global Heatmap',
        privacyInfo: isFrench
            ? 'La localisation est approximative (50m) pour préserver la confidentialité.'
            : 'Locations are approximate (50m) to preserve privacy.',
        noData: isFrench ? 'Aucune donnée de localisation disponible.' : 'No location data available.'
    };

    // Prepare heatmap points: [lat, lng, intensity]
    const heatmapPoints = useMemo(() => {
        return drinks
            .filter(d => d.lat !== undefined && d.lng !== undefined)
            .map(d => [d.lat!, d.lng!, 1] as [number, number, number]);
    }, [drinks]);

    // Calculate map center based on points or default to Europe/Paris
    const center: [number, number] = useMemo(() => {
        if (heatmapPoints.length > 0) {
            const sumLat = heatmapPoints.reduce((s, p) => s + p[0], 0);
            const sumLng = heatmapPoints.reduce((s, p) => s + p[1], 0);
            return [sumLat / heatmapPoints.length, sumLng / heatmapPoints.length];
        }
        return [48.8566, 2.3522]; // Paris
    }, [heatmapPoints]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl h-[80vh] bg-[#0a0a0f] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-b from-white/5 to-transparent flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-2xl">
                            <MapIcon size={22} className="text-blue-400" />
                        </div>
                        <h2 className="text-xl font-black text-white italic tracking-tight uppercase">{t.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all active:scale-95"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Privacy Banner */}
                <div className="px-6 py-2 bg-blue-500/10 border-y border-blue-500/20 flex items-center gap-2 text-[10px] font-bold text-blue-300 uppercase tracking-widest flex-shrink-0">
                    <Info size={14} />
                    {t.privacyInfo}
                </div>

                {/* Map Content */}
                <div className="flex-1 relative bg-[#050505]">
                    {heatmapPoints.length > 0 ? (
                        <MapContainer
                            center={center}
                            zoom={13}
                            style={{ height: '100%', width: '100%', background: '#050505' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            />
                            <HeatmapLayer points={heatmapPoints} />
                        </MapContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
                            <MapIcon size={64} strokeWidth={1} />
                            <p className="font-bold">{t.noData}</p>
                        </div>
                    )}
                </div>

                {/* Footer / Stats */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex justify-center flex-shrink-0">
                    <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                            {isFrench ? 'Points de chaleur : ' : 'Heat points: '}
                            <span className="text-white font-black">{heatmapPoints.length}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

'use client';

import React from 'react';

export interface ReportChartItem {
    name: string;
    value: number;
    maxScore: number;
    percentage: number;
}

export const OnlineRadarChart: React.FC<{
    items: ReportChartItem[];
    primaryColor: string;
}> = ({ items, primaryColor }) => {
    const size = 340;
    const center = size / 2;
    const radius = 115;
    const count = items.length;

    if (count < 3) {
        return (
            <div className="p-6 text-center text-text-muted text-sm">
                Wykres radarowy wymaga co najmniej 3 skal z określonym wynikiem maksymalnym.
            </div>
        );
    }

    const getPoint = (index: number, ratio: number) => {
        const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
        const r = radius * Math.max(0, Math.min(1, ratio));
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    const rings = [0.25, 0.5, 0.75, 1];
    const polygonPoints = items
        .map((item, idx) => {
            const pt = getPoint(idx, item.maxScore ? item.value / item.maxScore : 0);
            return `${pt.x},${pt.y}`;
        })
        .join(' ');

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[360px] h-auto overflow-visible">
                {/* Grid rings */}
                {rings.map((ring) => {
                    const ringPts = items
                        .map((_, idx) => {
                            const pt = getPoint(idx, ring);
                            return `${pt.x},${pt.y}`;
                        })
                        .join(' ');
                    return (
                        <polygon
                            key={ring}
                            points={ringPts}
                            fill="none"
                            stroke="currentColor"
                            className="text-border"
                            strokeWidth={1}
                            strokeDasharray={ring < 1 ? '3 3' : undefined}
                        />
                    );
                })}

                {/* Axes */}
                {items.map((item, idx) => {
                    const outer = getPoint(idx, 1);
                    const labelPt = getPoint(idx, 1.24);
                    return (
                        <g key={item.name}>
                            <line
                                x1={center}
                                y1={center}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="currentColor"
                                className="text-border"
                                strokeWidth={1}
                            />
                            <text
                                x={labelPt.x}
                                y={labelPt.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-current text-text text-[10px] font-semibold"
                            >
                                {item.name.length > 18 ? item.name.slice(0, 16) + '…' : item.name} ({Math.round(item.percentage)}%)
                            </text>
                        </g>
                    );
                })}

                {/* Data polygon */}
                <polygon
                    points={polygonPoints}
                    fill={primaryColor}
                    fillOpacity={0.28}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                />

                {/* Data vertices */}
                {items.map((item, idx) => {
                    const pt = getPoint(idx, item.maxScore ? item.value / item.maxScore : 0);
                    return (
                        <circle
                            key={item.name}
                            cx={pt.x}
                            cy={pt.y}
                            r={4.5}
                            fill={primaryColor}
                            stroke="#14161d"
                            strokeWidth={1.5}
                        />
                    );
                })}
            </svg>
        </div>
    );
};

export function formatAiTextToHtml(rawText: string): string {
    const cleaned = rawText
        .replace(/^```html\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
    if (cleaned.includes('<p>') || cleaned.includes('<ul>') || cleaned.includes('<strong>')) {
        return cleaned;
    }
    return cleaned
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .split(/\n{2,}/)
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

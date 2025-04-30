// 🎛️ SettingsPanel.tsx — panneau de configuration global de l’application

import React, { useState, useEffect } from 'react';

const themes = ['clair', 'sombre', 'sepia'] as const;
type Theme = typeof themes[number];

interface Settings {
  theme: Theme;
  fontSize: number;
  nightMode: boolean;
  nightStart: string;
  nightEnd: string;
}

const defaultSettings: Settings = {
  theme: 'clair',
  fontSize: 22,
  nightMode: false,
  nightStart: '20:00',
  nightEnd: '07:00',
};

export const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--quote-font-size', `${settings.fontSize}px`);
  }, [settings]);

  const update = (partial: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return (
    <section className="p-4 max-w-xl mx-auto rounded-xl shadow theme-clair:bg-white theme-sombre:bg-gray-800 theme-sepia:bg-[#f3ead6] transition-all">
      <h2 className="text-lg font-semibold mb-6 theme-clair:text-gray-800 theme-sombre:text-white theme-sepia:text-[#3e342a]">
        Paramètres d'affichage
      </h2>

      {/* 🎨 Thème */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Choisir un thème</label>
        <div className="flex gap-3">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => update({ theme: t })}
              className={`px-4 py-2 text-sm rounded-full border ${
                settings.theme === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 bg-white'
              } transition`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 🔠 Taille de texte */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Taille du texte</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update({ fontSize: Math.max(14, settings.fontSize - 2) })}
            className="px-3 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-sm"
          >
            A−
          </button>
          <span className="font-mono text-base">{settings.fontSize}px</span>
          <button
            onClick={() => update({ fontSize: Math.min(40, settings.fontSize + 2) })}
            className="px-3 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-sm"
          >
            A+
          </button>
        </div>
      </div>

      {/* 🌙 Mode nuit */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Mode nuit automatique</label>
        <div className="flex items-center gap-4 mb-2">
          <input
            type="checkbox"
            checked={settings.nightMode}
            onChange={(e) => update({ nightMode: e.target.checked })}
          />
          <span>{settings.nightMode ? 'Activé' : 'Désactivé'}</span>
        </div>
        {settings.nightMode && (
          <div className="flex gap-4 text-sm">
            <div>
              <label className="block mb-1">Début</label>
              <input
                type="time"
                value={settings.nightStart}
                onChange={(e) => update({ nightStart: e.target.value })}
                className="rounded border px-2 py-1"
              />
            </div>
            <div>
              <label className="block mb-1">Fin</label>
              <input
                type="time"
                value={settings.nightEnd}
                onChange={(e) => update({ nightEnd: e.target.value })}
                className="rounded border px-2 py-1"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

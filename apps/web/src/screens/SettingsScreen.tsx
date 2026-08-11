import React from 'react';
import { CARD_BACKS, type CardBack } from '../config/cardBacks';
import { updateCardBackSettings, useCardBackSettings } from '../state/settings';

interface SettingsScreenProps {
  onBack: () => void;
}

function DefaultPreview({ back }: { back: CardBack }) {
  return <span className={`settings-default-preview kl-back--${back.id}`}><span className="kl-back-inner" /></span>;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const settings = useCardBackSettings();

  const chooseCustom = (back: CardBack) => {
    updateCardBackSettings({ useCustomBacks: true, selectedCustomBack: back.id });
  };

  const chooseDefault = (back: CardBack) => {
    updateCardBackSettings({ useCustomBacks: false, selectedDefaultBack: back.id as typeof settings.selectedDefaultBack });
  };

  const visibleBacks = settings.useCustomBacks ? CARD_BACKS.custom : CARD_BACKS.default;

  return (
    <main className="settings-screen">
      <header className="settings-header">
        <button type="button" className="kl-btn" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to game
        </button>
        <div>
          <h1>Card Back Gallery</h1>
          <p>Choose a familiar face for every hidden card.</p>
        </div>
      </header>

      <section className="settings-panel" aria-labelledby="custom-backs-title">
        <div className="settings-toggle-row">
          <div>
            <h2 id="custom-backs-title">Use family photos</h2>
            <p>Turn on a personal photo back, or return to the heirloom patterns.</p>
          </div>
          <button
            type="button"
            className={`settings-toggle${settings.useCustomBacks ? ' settings-toggle--on' : ''}`}
            role="switch"
            aria-checked={settings.useCustomBacks}
            onClick={() => updateCardBackSettings({ useCustomBacks: !settings.useCustomBacks })}
          >
            <span />
          </button>
        </div>

        {settings.useCustomBacks && (
          <div className="settings-mode" role="radiogroup" aria-labelledby="card-back-mode-title">
            <span id="card-back-mode-title" className="settings-mode-label">Card back mode</span>
            <button
              type="button"
              role="radio"
              aria-checked={settings.cardBackMode === 'single'}
              className={`settings-mode-option${settings.cardBackMode === 'single' ? ' settings-mode-option--selected' : ''}`}
              onClick={() => updateCardBackSettings({ cardBackMode: 'single' })}
            >
              Use one selected photo
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={settings.cardBackMode === 'random'}
              className={`settings-mode-option${settings.cardBackMode === 'random' ? ' settings-mode-option--selected' : ''}`}
              onClick={() => updateCardBackSettings({ cardBackMode: 'random' })}
            >
              Use random photo for each card
            </button>
          </div>
        )}

        {settings.useCustomBacks && settings.cardBackMode === 'random' ? (
          <p className="settings-random-note">Each card will use a random photo from your collection.</p>
        ) : (
        <div className="settings-gallery" aria-label={settings.useCustomBacks ? 'Family photo card backs' : 'Premium card backs'}>
          {visibleBacks.map((back) => {
            const selected = settings.useCustomBacks
              ? settings.selectedCustomBack === back.id
              : settings.selectedDefaultBack === back.id;

            return (
              <button
                type="button"
                key={back.id}
                className={`settings-back${selected ? ' settings-back--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => settings.useCustomBacks ? chooseCustom(back) : chooseDefault(back)}
              >
                {back.type === 'custom' ? (
                  <img src={back.url} alt="" className="settings-photo-preview" />
                ) : (
                  <DefaultPreview back={back} />
                )}
                <span>{back.label}</span>
              </button>
            );
          })}
        </div>
        )}
      </section>
    </main>
  );
}

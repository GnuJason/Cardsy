import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { CARD_BACKS } from './config/cardBacks';
import { KlondikeScreen } from './screens/KlondikeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useCardBackSettings } from './state/settings';
export const App = () => {
    const [screen, setScreen] = useState('game');
    const settings = useCardBackSettings();
    const selectedCustom = CARD_BACKS.custom.find((back) => back.id === settings.selectedCustomBack);
    const cardBackUrl = settings.useCustomBacks && settings.cardBackMode === 'single'
        ? selectedCustom?.url ?? null
        : null;
    if (screen === 'settings') {
        return _jsx(SettingsScreen, { onBack: () => setScreen('game') });
    }
    return (_jsx(KlondikeScreen, { backVariant: settings.selectedDefaultBack, cardBackUrl: cardBackUrl, cardBackMode: settings.cardBackMode, customBackList: CARD_BACKS.custom.map((back) => back.url), onSettings: () => setScreen('settings') }));
};
export default App;

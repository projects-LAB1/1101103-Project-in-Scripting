import React, { createContext, useContext, useState } from 'react';

const SoundSelectionContext = createContext();

export const useSoundSelection = () => {
  const context = useContext(SoundSelectionContext);
  if (!context) {
    throw new Error('useSoundSelection must be used within a SoundSelectionProvider');
  }
  return context;
};

export const SoundSelectionProvider = ({ children }) => {
  const [selectedSound, setSelectedSound] = useState({
    id: 'default',
    name: 'เสียงเริ่มต้น'
  });
  const [pendingSelection, setPendingSelection] = useState(null);

  const selectSound = (sound) => {
    setPendingSelection(sound);
  };

  const confirmSelection = () => {
    if (pendingSelection) {
      setSelectedSound(pendingSelection);
      setPendingSelection(null);
    }
  };

  const cancelSelection = () => {
    setPendingSelection(null);
  };

  const value = {
    selectedSound,
    pendingSelection,
    selectSound,
    confirmSelection,
    cancelSelection,
    setSelectedSound
  };

  return (
    <SoundSelectionContext.Provider value={value}>
      {children}
    </SoundSelectionContext.Provider>
  );
};

export default SoundSelectionProvider; 
# React Navigation Non-Serializable Values Fix

## Problem
The app was showing a React Navigation warning:
```
WARN Non-serializable values were found in the navigation state. Check:
Main > Alarm > SoundPicker > params.onSelectSound (Function)
```

This warning occurs when functions are passed as navigation parameters, which can break state persistence and restoration.

## Root Cause
In `AddAlarmScreen.js`, the `goToSoundPicker` function was passing a callback function (`onSelectSound`) as a navigation parameter:

```javascript
// PROBLEMATIC CODE (BEFORE FIX)
const goToSoundPicker = () => {
  navigation.navigate("SoundPicker", {
    selectedSoundId: soundId,
    onSelectSound: (selectedSound) => {  // ❌ Function passed as param
      console.log("เลือกเสียง:", selectedSound);
      setSoundId(selectedSound.id);
      setSoundName(selectedSound.name);
    }
  });
};
```

## Solution
Created a React Context-based state management system to handle sound selection without passing functions through navigation parameters.

### 1. Created SoundSelectionContext
**File:** `contexts/SoundSelectionContext.js`

```javascript
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
```

### 2. Updated App.js Provider Hierarchy
Added `SoundSelectionProvider` to the app's provider hierarchy:

```javascript
import { SoundSelectionProvider } from './contexts/SoundSelectionContext';

// ...

return (
  <Provider store={store}>
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AlarmProvider>
            <SleepProvider>
              <AlarmSoundProvider>
                <SoundSelectionProvider>  {/* ✅ Added here */}
                  <RootNavigator ref={navigationRef} />
                </SoundSelectionProvider>
              </AlarmSoundProvider>
            </SleepProvider>
          </AlarmProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  </Provider>
);
```

### 3. Updated AddAlarmScreen.js
**Changes made:**
- Import the context hook
- Use context instead of navigation parameters
- Listen for sound selection changes via useEffect

```javascript
import { useSoundSelection } from '../contexts/SoundSelectionContext';

const AddAlarmScreen = ({ route, navigation }) => {
  const { selectedSound, setSelectedSound } = useSoundSelection();

  // ✅ FIXED: No function passed as navigation parameter
  const goToSoundPicker = () => {
    setSelectedSound({
      id: soundId,
      name: soundName
    });
    
    navigation.navigate("SoundPicker");  // No params needed!
  };

  // Listen for sound selection changes from context
  React.useEffect(() => {
    if (selectedSound && selectedSound.id !== soundId) {
      setSoundId(selectedSound.id);
      setSoundName(selectedSound.name);
    }
  }, [selectedSound]);
};
```

### 4. Updated SoundPickerScreen.js
**Changes made:**
- Import the context hook
- Use context instead of route parameters
- Remove dependency on callback functions

```javascript
import { useSoundSelection } from '../contexts/SoundSelectionContext';

const SoundPickerScreen = ({ route, navigation }) => {
  const { selectedSound, selectSound, confirmSelection } = useSoundSelection();
  const [selectedId, setSelectedId] = useState(selectedSound?.id || 'default');

  // ✅ FIXED: Use context instead of callback
  const handleSave = () => {
    const selectedSoundItem = availableSounds.find(item => item.id === selectedId);
    if (selectedSoundItem) {
      selectSound({
        id: selectedSoundItem.id,
        name: selectedSoundItem.name,
      });
      confirmSelection();
    }
    navigation.goBack();
  };
};
```

### 5. Updated SoundLibraryScreen.js
Applied the same context-based approach for consistency.

## Benefits of This Solution

1. **✅ Eliminates React Navigation Warning**: No more non-serializable values in navigation state
2. **✅ Better State Management**: Centralized sound selection state
3. **✅ Improved Performance**: No unnecessary re-renders from prop drilling
4. **✅ Better Testability**: Context can be easily mocked for testing
5. **✅ Consistent Pattern**: Same approach can be used for other similar scenarios
6. **✅ State Persistence**: Navigation state can now be properly serialized and restored

## Testing
After implementing these changes:
1. Navigate to Add Alarm screen
2. Tap on sound selection
3. Select a different sound
4. Verify no React Navigation warnings appear in console
5. Verify sound selection works correctly

## Files Modified
- `contexts/SoundSelectionContext.js` (new file)
- `App.js` (added provider)
- `screens/AddAlarmScreen.js` (context integration)
- `screens/SoundPickerScreen.js` (context integration)
- `screens/SoundLibraryScreen.js` (context integration)

## Alternative Solutions Considered
1. **navigation.setOptions()**: Would work but less clean for this use case
2. **Redux/Global State**: Overkill for this specific feature
3. **Event Emitters**: More complex and harder to maintain
4. **AsyncStorage**: Would persist unnecessarily and add complexity

The React Context solution provides the best balance of simplicity, performance, and maintainability. 
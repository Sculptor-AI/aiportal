import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling easter egg triggers
 * 
 * Easter Eggs:
 * 1. Konami Code (↑↑↓↓←→←→BA) - Triggers confetti explosion
 * 2. Typing "matrix" anywhere - Triggers Matrix rain effect
 */

const KONAMI_CODE = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

const useEasterEggs = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [showMatrix, setShowMatrix] = useState(false);

    const konamiIndexRef = useRef(0);
    const typedKeysRef = useRef('');

    // Reset Konami progress after timeout
    const resetKonami = useCallback(() => {
        konamiIndexRef.current = 0;
    }, []);

    // Handle key presses for Konami code and secret phrases
    useEffect(() => {
        let konamiTimeout = null;
        let phraseTimeout = null;

        const handleKeyDown = (e) => {
            // Skip if user is typing in an input
            const activeEl = document.activeElement;
            const isTyping = activeEl?.tagName === 'INPUT' ||
                activeEl?.tagName === 'TEXTAREA' ||
                activeEl?.isContentEditable;

            // For Konami code - works even when typing
            const keyCode = e.code;

            if (keyCode === KONAMI_CODE[konamiIndexRef.current]) {
                konamiIndexRef.current++;

                // Clear previous timeout
                if (konamiTimeout) clearTimeout(konamiTimeout);

                // Reset if no progress in 2 seconds
                konamiTimeout = setTimeout(resetKonami, 2000);

                // Check if complete - trigger confetti silently
                if (konamiIndexRef.current === KONAMI_CODE.length) {
                    setShowConfetti(true);
                    konamiIndexRef.current = 0;
                }
            } else if (KONAMI_CODE.includes(keyCode)) {
                // Wrong key in sequence, check if it starts a new sequence
                if (keyCode === KONAMI_CODE[0]) {
                    konamiIndexRef.current = 1;
                } else {
                    konamiIndexRef.current = 0;
                }
            }

            // For typed phrases (only when not in an input that matters)
            if (!isTyping || activeEl?.dataset?.allowEasterEggs) {
                const key = e.key.toLowerCase();
                if (key.length === 1) {
                    typedKeysRef.current += key;

                    // Keep only last 20 characters
                    if (typedKeysRef.current.length > 20) {
                        typedKeysRef.current = typedKeysRef.current.slice(-20);
                    }

                    // Clear typed keys after 3 seconds of inactivity
                    if (phraseTimeout) clearTimeout(phraseTimeout);
                    phraseTimeout = setTimeout(() => {
                        typedKeysRef.current = '';
                    }, 3000);

                    // Check for matrix trigger
                    if (typedKeysRef.current.endsWith('matrix')) {
                        setShowMatrix(true);
                        typedKeysRef.current = '';
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (konamiTimeout) clearTimeout(konamiTimeout);
            if (phraseTimeout) clearTimeout(phraseTimeout);
        };
    }, [resetKonami]);

    // Close handlers
    const closeConfetti = useCallback(() => setShowConfetti(false), []);
    const closeMatrix = useCallback(() => setShowMatrix(false), []);

    return {
        showConfetti,
        showMatrix,
        closeConfetti,
        closeMatrix,
    };
};

export default useEasterEggs;

import '@testing-library/jest-dom';

if (!window.matchMedia) {
  // Minimal matchMedia stub so Ant Design's responsive hooks do not crash under jsdom.
  window.matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

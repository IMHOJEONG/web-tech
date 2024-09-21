// https://m3.material.io/foundations/layout/applying-layout/window-size-classes
export const minMediaQuery = (bp: string) => `@media (min-width: ${bp}px)`;
export const maxMediaQuery = (bp: string) => `@media (max-width: ${bp}px)`;
export const minAndMaxMediaQuery = (min: string, max: string) =>
  `@media (min-width: ${min}px) and (max-width: ${max}px)`;

export const breakPoints = {
  compact: {
    max: 600,
  },
  medium: {
    min: 600,
    max: 840,
  },
  expanded: {
    min: 840,
    max: 1200,
  },
  large: {
    min: 1200,
    max: 1600,
  },
  extraLarge: {
    min: 1600,
  },
};

/**
 * Centralized color system for the four core entities
 */

export type EntityType = 'company' | 'account' | 'persona' | 'campaign';

export interface EntityColorConfig {
  dot: string;          // For small dots/indicators
  cardTitle: string;    // For card title colors (optional styling)
  cardHoverBorder: string; // For card hover border colors
  navActive: string;    // For active navigation background and text
  navHover: string;     // For navigation hover state
}

export const ENTITY_COLORS: Record<EntityType, EntityColorConfig> = {
  company: {
    dot: 'bg-green-400',
    cardTitle: 'text-green-700',
    cardHoverBorder: 'hover:border-green-400',
    navActive: 'bg-green-50 text-green-700 font-medium',
    navHover: 'hover:bg-green-50 hover:text-green-700 hover:font-medium'
  },
  account: {
    dot: 'bg-red-400',
    cardTitle: 'text-red-700',
    cardHoverBorder: 'hover:border-red-400',
    navActive: 'bg-red-50 text-red-700 font-medium',
    navHover: 'hover:bg-red-50 hover:text-red-700 hover:font-medium'
  },
  persona: {
    dot: 'bg-blue-400',
    cardTitle: 'text-blue-700',
    cardHoverBorder: 'hover:border-blue-400',
    navActive: 'bg-blue-50 text-blue-700 font-medium',
    navHover: 'hover:bg-blue-50 hover:text-blue-700 hover:font-medium'
  },
  campaign: {
    dot: 'bg-purple-400',
    cardTitle: 'text-purple-700',
    cardHoverBorder: 'hover:border-purple-400',
    navActive: 'bg-purple-50 text-purple-700 font-medium',
    navHover: 'hover:bg-purple-50 hover:text-purple-700 hover:font-medium'
  }
};

/**
 * Get color configuration for an entity
 */
export function getEntityColors(entityType: EntityType): EntityColorConfig {
  return ENTITY_COLORS[entityType];
}

/**
 * Get just the dot color for an entity (most common use case)
 */
export function getEntityDotColor(entityType: EntityType): string {
  return ENTITY_COLORS[entityType].dot;
}

/**
 * Get card title color for an entity
 */
export function getEntityCardTitleColor(entityType: EntityType): string {
  return ENTITY_COLORS[entityType].cardTitle;
}

/**
 * Get navigation active styling for an entity
 */
export function getEntityNavActiveClass(entityType: EntityType): string {
  return ENTITY_COLORS[entityType].navActive;
}

/**
 * Get navigation hover styling for an entity
 */
export function getEntityNavHoverClass(entityType: EntityType): string {
  return ENTITY_COLORS[entityType].navHover;
}

/**
 * Get card hover border color for an entity
 */
export function getEntityCardHoverBorder(entityType: EntityType): string {
  return ENTITY_COLORS[entityType].cardHoverBorder;
}

/**
 * Legacy support - for SummaryCard parents prop
 */
export function getEntityColorForParent(entityType: EntityType): string {
  return ENTITY_COLORS[entityType].dot;
}
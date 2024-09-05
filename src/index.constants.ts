export type SuitType = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export enum SuitsEnum {
  CLUBS = 'clubs',
  DIAMONDS = 'diamonds',
  HEARTS = 'hearts',
  SPADES = 'spades'
}

export const SUITS_MAP = new Map([
  [SuitsEnum.CLUBS, '♣'],
  [SuitsEnum.DIAMONDS, '♦'],
  [SuitsEnum.HEARTS, '♥'],
  [SuitsEnum.SPADES, '♠'],
]);

export const DECK_POWER_MAP = new Map([
  [6, '6'],
  [7, '7'],
  [8, '8'],
  [9, '9'],
  [10, '10'],
  [11, 'J'],
  [12, 'Q'],
  [13, 'K'],
  [14, 'A'],
]);

export const SUITS = Array.from(SUITS_MAP.keys());
export const DECK_POWERS = Array.from(DECK_POWER_MAP.keys());
export const ALLOWED_MOVEMENT_COUNT = 6;
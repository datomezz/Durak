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
  [8, '6'],
  [9, '7'],
  [10, '10'],
  [11, 'J'],
  [12, 'Q'],
  [13, 'K'],
  [14, 'A'],
]);

export const SUITS = Array.from(SUITS_MAP.keys());
export const DECK_POWERS = Array.from(DECK_POWER_MAP.keys());

export enum ElementEnum {
  CARD = 'CARD',
  CARD_DUMMY = 'CARD_DUMMY',
  TABLE_CARDS = 'TABLE_CARDS',
  PLAYER_DUMMY = 'PLAYER_DUMMY',
  PLAYER = 'PLAYER',
  GAME = 'GAME',
  TRUMP = 'TRUMP'
};

export const HTML_SELECTOR_MAP = new Map();
HTML_SELECTOR_MAP
  .set(ElementEnum.CARD, 'card')
  .set(ElementEnum.CARD_DUMMY, 'card-dummy')
  .set(ElementEnum.TABLE_CARDS, 'table-cards')
  .set(ElementEnum.PLAYER_DUMMY, 'player-dummy')
  .set(ElementEnum.PLAYER, 'player-original')
  .set(ElementEnum.GAME, 'game')


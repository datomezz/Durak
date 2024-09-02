import './style.css'

export enum ElementEnum {
  CARD = 'CARD',
  CARD_DUMMY = 'CARD_DUMMY',
  TABLE_CARDS = 'TABLE_CARDS',
  PLAYER_DUMMY = 'PLAYER_DUMMY',
  PLAYER = 'PLAYER',
  GAME = 'GAME'
};

export const HTML_SELECTOR_MAP = new Map();
HTML_SELECTOR_MAP
  .set(ElementEnum.CARD, 'card')
  .set(ElementEnum.CARD_DUMMY, 'card-dummy')
  .set(ElementEnum.TABLE_CARDS, 'table-cards')
  .set(ElementEnum.PLAYER_DUMMY, 'player-dummy')
  .set(ElementEnum.PLAYER, 'player-original')
  .set(ElementEnum.GAME, 'game')


export interface IUiEntityConstructor {
  dummy: 1 | 2 | 3
};

class UIEntity {
  static $ROOT = document.querySelector<HTMLDivElement>('#app');
  static PLAYER_DUMMY_COUNT: number = 1;

  static crateElement = (type: ElementEnum, cardArgs: CardEntity | null = null) => {
    const $el = document.createElement('div');


    switch(type) {
      case ElementEnum.CARD:
        $el.className = 'card card-original';
        if(!cardArgs) break;
        for(let [key, value] of Object.entries(cardArgs)) {
          $el.dataset[key] = value;
          $el.innerHTML = `
            <span class="card__label">${cardArgs.label}</span>
            <span class="card__suit">${SUITS_MAP.get(cardArgs.suit as any)}</span>
            <span class="card__label">${cardArgs.label}</span>
          `;
          $el.classList.add(cardArgs.suit ?? '');
        }
        break;
      case ElementEnum.CARD_DUMMY:
        $el.className = 'card card-dummy';
        if(!cardArgs) break;
        for(let [key, value] of Object.entries(cardArgs)) {
          $el.dataset[key] = value;
          $el.innerHTML = `
            <span class="card__label">${cardArgs.label}</span>
            <span class="card__suit">${SUITS_MAP.get(cardArgs.suit as any)}</span>
            <span class="card__label">${cardArgs.label}</span>
          `;
          $el.classList.add(cardArgs.suit ?? '');
        }
        break;
      case ElementEnum.PLAYER:
        $el.className = 'cards player-original';
        break;
      case ElementEnum.PLAYER_DUMMY:
        $el.className = 'cards player-dummy';
        $el.dataset.id = `${UIEntity.PLAYER_DUMMY_COUNT++}`;
        break;
      case ElementEnum.GAME:
        $el.className = 'game';
        break;
      case ElementEnum.TABLE_CARDS:
        $el.className = 'table-cards';
        break;
      default:
        break;
    }

    return $el;
  }

  public generateDefaultPlayField = (players: PlayerEntity[]) => {
    const $game = UIEntity.crateElement(ElementEnum.GAME);
    const $player_dummys = Array.from({length: players.length}, (_) => UIEntity.crateElement(ElementEnum.PLAYER_DUMMY));
    const $table_cards = UIEntity.crateElement(ElementEnum.TABLE_CARDS);
    const $player = UIEntity.crateElement(ElementEnum.PLAYER);

    // Dummy Players
    for(let i = 0; i < $player_dummys.length; i++) {
      const $player_dummy = $player_dummys[i];
      for(let x = 0; x < 6; x++) {
        $player_dummy.appendChild(UIEntity.crateElement(ElementEnum.CARD_DUMMY, players[i].myCards[x]));
      }

      $game.appendChild($player_dummy);
    }

    // Player
    for(let i = 0; i < 6; i++) {
      $player.appendChild(UIEntity.crateElement(ElementEnum.CARD, players[players.length - 1].myCards[i]));
      $table_cards.appendChild(UIEntity.crateElement(ElementEnum.CARD));
    }

    $game.appendChild($player);
    $game.appendChild($table_cards);

    UIEntity.$ROOT?.appendChild($game);
  }

  public DUMMY: 1 | 2 | 3 = 1;

  constructor() { }

  public removeElement = (el: HTMLDivElement) => {
    el.remove();
  }
}

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

export interface ICardConstructor {
  power: number,
  isTrump: boolean,
  suit: SuitType
}

export class CardEntity {
  static ID: number = 0;

  public id: number = 0;
  public power: number = 0;
  public isTrump: boolean = false;
	public suit: SuitType | null = null;

  constructor(args: ICardConstructor) {
    this.power = args.power;
    this.isTrump = args.isTrump;
    this.suit = args.suit;
    this.id = CardEntity.ID++;
  }

	get label() {
		return `${DECK_POWER_MAP.get(this.power)} ${SUITS_MAP.get(this.suit as any)}`;
	}

	public isAllowToMove: boolean = false;
}

export class PlayerEntity {
  constructor() { }

  public myCards: CardEntity[] = [];

  public setCards = (cards: CardEntity[]) => {
    this.myCards = cards;
  }

  private _isMyTurnToMove: boolean = false;
  private _isMyTurnToCounterMove: boolean = false;

  get isMyTurnToMove() {
    return this._isMyTurnToMove;
  } 

  set isMyTurnToMove(bool: boolean) {
    this._isMyTurnToMove = bool;
  }

  get isMyTurnToCounterMove() {
    return this._isMyTurnToCounterMove;
  } 

  set isMuTurnToCounterMove(bool: boolean) {
    this._isMyTurnToCounterMove = bool;
  }
  
  protected modifyCardsForMoving = () => {};

  public check = () => {};
  public move = (card: CardEntity) => {};
  public take = (cards: CardEntity[]) => {};
}

export class BoardEntity {
  static MOVE_COUNT = 0;
  public TRUMP: SuitsEnum | null = null;
  public UI: UIEntity | null = null

  constructor(args: IUiEntityConstructor) {
    this.TRUMP = SUITS[~~(Math.random() * SUITS.length)];
    this.UI = new UIEntity();
    this.players = Array.from({length: args.dummy}, () => new PlayerEntity())
  }

  public allCards: CardEntity[] = [];
  public dumpCards: CardEntity[] = [];
  public players: PlayerEntity[] = [];
  public fillAllPlayersCards = () => {}
	public defineWhoMoves = () => {}

	private _firstMove: boolean = false;

  private _generateDeck = () => {
    const arr = [];
    for(let x = 0; x < SUITS.length; x++) {
      for(let i = 0; i < DECK_POWERS.length; i++) {
        arr.push(new CardEntity({isTrump: SUITS[x] === this.TRUMP, power: DECK_POWERS[i], suit: SUITS[x]}));
      }
    }

    this.allCards = this._shuffleDeck(arr);
    this._distributeCardsToPlayers();
  }

  private _distributeCardsToPlayers = () => {
    for(let i = 0; i < this.players.length; i++) {
      const removedCards = this.allCards.splice(0, 6);
      this.players[i].setCards(removedCards);
    }

    console.log('cards', this.allCards);
    console.log('players', this.players);
  }

  private _shuffleDeck = (cards: CardEntity[]): CardEntity[] => {
    let currentIndex = cards.length;
    while(currentIndex !== 0) {
      const randomIndex = ~~(Math.random() * currentIndex);
      currentIndex--;
      [cards[currentIndex], cards[randomIndex]] = [cards[randomIndex], cards[currentIndex]];
    }

    return cards;
  }

  public init = () => {
    if(!this.UI) return;
    this._generateDeck();
    this.UI.generateDefaultPlayField(this.players);
  }
}

function init() {
  new BoardEntity({dummy: 3}).init();
}

init();
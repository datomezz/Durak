import { CardEntity } from './entities/card.entity';
import { DECK_POWERS, SUITS, SuitsEnum } from './index.constants';
import { PlayerEntity } from './entities/player.entity';
import './style.css'
import { UIEntity } from './entities/ui.entity';

// CREATE Events object, iterate throught this object, create listeners
export enum EVENTS_ENUM {
  CLICK = 'CLICK',
  SET_TABLE = 'SET_TABLE',
  TEST = 'TEST'
}

export const EVENTS = {
  [EVENTS_ENUM.CLICK]: [EVENTS_ENUM.CLICK],
  [EVENTS_ENUM.SET_TABLE]: [EVENTS_ENUM.SET_TABLE],
  [EVENTS_ENUM.TEST]: [EVENTS_ENUM.TEST]
}

export class EventEntity {
  static dispatch = (type: EVENTS_ENUM, data: any) => {
    const event = new CustomEvent(type, {
      detail: data
    });

    document.dispatchEvent(event);
  }

  static listen = () => {
    for(let event of Object.keys(EVENTS)) {
      document.addEventListener(event, function(e: any) {
        const target = e.detail;
        console.log('Custom event triggered:', target);
      });
    }

  }
}

// Add an event listener to handle the event

export interface IBoardEntityConstructor {
  totalPlayers: 2 | 3 | 4
};

export class BoardEntity {
  static MOVE_COUNT = 0;
  public TRUMP: SuitsEnum | null = null;
  public UI: UIEntity | null = null
  public TOTAL_PLAYERS: number = 2;

  constructor(args: IBoardEntityConstructor) {
    this.TRUMP = SUITS[~~(Math.random() * SUITS.length)];
    this.UI = new UIEntity();
    this.TOTAL_PLAYERS = args.totalPlayers;

    this._players = Array.from({length: args.totalPlayers}, () => new PlayerEntity());
    // DEFINE HUMAN, HUMAN IS ALWAYS LAST INDEX
    this._players[this.players.length - 1].isHuman = true;
  }

  public allCards: CardEntity[] = [];
  public dumpCards: CardEntity[] = [];

  private _table: CardEntity[][] = [];
  get table() {
    return this._table;
  }
  set table(table: CardEntity[][]) {
    if(table.length <= 6) {
      this._table = table;
      EventEntity.dispatch(EVENTS_ENUM.SET_TABLE, table);
    }
  }


  private _players: PlayerEntity[] = [];
  get players() {
    return this._players;
  }

  set players(players: PlayerEntity[]) {
    this._players = players;
  }
  
	private _firstMove: boolean = true;

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
  }

  private _cardsToTableCards = (cards: CardEntity[]) => {
    const result = [];
    let chunkSize = 2;
  
    for (let i = 0; i < cards.length; i += chunkSize) {
      const chunk = cards.slice(i, i + chunkSize);
      result.push(chunk);
    }
    
    return result;
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

  private _defineWhoMovesFirst = () => {
    if(this._firstMove) {
      const playersCards = [...this.players.flatMap(player => player.myCards)];
      const trumpCards = playersCards.filter(card => card.isTrump).sort((a, b) => a.power - b.power);

      if(!trumpCards.length) {
        this.players[0].isMyTurnToMove = true;
        this.players[0].modifyCardsForMoving();
        this.players[1].isMyTurnToCounterMove = true;
        return;
      }

      const playerWithLowerTrumpIdx = this.players.findIndex(player => player.myCards.includes(trumpCards[0]));
      this.players[playerWithLowerTrumpIdx].isMyTurnToMove = true;
      this.players[playerWithLowerTrumpIdx].modifyCardsForMoving();

      if(playerWithLowerTrumpIdx == this.TOTAL_PLAYERS - 1 && !this.players?.[playerWithLowerTrumpIdx + 1]) {
        this.players[0].isMyTurnToCounterMove = true;
      } else {
        this.players[playerWithLowerTrumpIdx + 1].isMyTurnToCounterMove = true;
      }

      this._firstMove = false;
    }
  }

  private _removeCardFromPlayer = (cardId: string) => {
    const playerIdx = this._findPlayerIdxById(cardId);
    const player = this.players[playerIdx];
    const removeIdx = player.myCards.findIndex(card => card.id === +cardId);
    const remvoedCard = player.myCards.splice(removeIdx, 1);
    this.table = this._cardsToTableCards([...this.table.flatMap(item => item), ...remvoedCard]);
    this.players[playerIdx] = player;
  }

  private _findPlayerIdxById = (cardId: string): number => {
    const card = this.players.flatMap(player => player.myCards).find(card => card.id == +cardId);
    if(!card) return -1;

    return this.players.findIndex(player => player.myCards.includes(card));
  }

  public init = () => {
    if(!this.UI) return;
    this._generateDeck();
    this.UI.generateDefaultPlayField(this.players);
    this._defineWhoMovesFirst();

    document.addEventListener(EVENTS_ENUM.CLICK, (e: any) => {
      const target = e.detail;
      this._removeCardFromPlayer(target.dataset.id);
    })

    document.addEventListener(EVENTS_ENUM.SET_TABLE, (e: any) => {
      const cards: CardEntity[][] = e.detail;
      UIEntity.updateTable(cards);
      console.log(EVENTS_ENUM.SET_TABLE, cards);
    })

    // document.querySelectorAll('.player-original').forEach($el => {
    //   $el.addEventListener('click', (e: any) => {
    //     this.players[this.players.length -1].modifyCardsForMoving(this.tableCards);
    //     console.log('click', this.tableCards, this.players[3].myCards);
    //   })
    // })
  }
}

function init() {
  new BoardEntity({totalPlayers: 4}).init();
}

init();
/* 
  TASKS TO DO:
  1) rewrite render logic, put it into the border class
  2) write update logic on state change while events
  3) Write Event loop and add different events
*/
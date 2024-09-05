import { CardEntity } from './entities/card.entity';
import { ALLOWED_MOVEMENT_COUNT, DECK_POWERS, SUITS, SUITS_MAP, SuitsEnum } from './index.constants';
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
  static IS_MOVEMENT_ALLOWED: boolean = true;

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
    if(table.length <= ALLOWED_MOVEMENT_COUNT) {
      this._table = table;
      EventEntity.dispatch(EVENTS_ENUM.SET_TABLE, table);

      if(table.flatMap(item => item).length === ALLOWED_MOVEMENT_COUNT * 2) {
        BoardEntity.IS_MOVEMENT_ALLOWED = false;
      }
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
      const removedCards = this.allCards.splice(0, ALLOWED_MOVEMENT_COUNT);
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
        this.players[0].modifyCardsForMoving(this.table);
        this.players[1].isMyTurnToCounterMove = true;
        return;
      }

      const playerWithLowerTrumpIdx = this.players.findIndex(player => player.myCards.includes(trumpCards[0]));
      this.players[playerWithLowerTrumpIdx].isMyTurnToMove = true;
      this.players[playerWithLowerTrumpIdx].modifyCardsForMoving(this.table);

      if(playerWithLowerTrumpIdx == this.TOTAL_PLAYERS - 1 && !this.players?.[playerWithLowerTrumpIdx + 1]) {
        this.players[0].isMyTurnToCounterMove = true;
      } else {
        this.players[playerWithLowerTrumpIdx + 1].isMyTurnToCounterMove = true;
      }

      this._firstMove = false;
    }
  }

  private _removeCardFromPlayer = (cardId: string) => {
    const playerIdx = this._findPlayerIdxByCardId(cardId);
    const player = this.players[playerIdx];
    const removeIdx = player.myCards.findIndex(card => card.id === +cardId);
    const remvoedCard = player.myCards.splice(removeIdx, 1);
    this.table = this._cardsToTableCards([...this.table.flatMap(item => item), ...remvoedCard]);
    this.players[playerIdx] = player;

    UIEntity.removeCard(cardId);
  }

  private _findPlayerIdxByCardId = (cardId: string): number => {
    const card = this.players.flatMap(player => player.myCards).find(card => card.id == +cardId);
    if(!card) return -1;

    return this.players.findIndex(player => player.myCards.includes(card));
  }

  private _findPlayerIdxWhoMoves = () => {
    return this.players.findIndex(player => player.isMyTurnToMove);
  }

  private _findPlayerIdxWhoCounterMoves = () => {
    return this.players.findIndex(player => player.isMyTurnToCounterMove);
  }

  public updatePlayersCardsForMoving = () => {
    this.players.forEach(item => item.modifyCardsForMoving(this.table));
  }

  public checkAction = () => {
    const lastMovingPlayer = this._findPlayerIdxWhoMoves();
    const counterMovePlayerIdx = this._findPlayerIdxWhoCounterMoves();
    const proxyPlayers = [...this.players];
    proxyPlayers.splice(counterMovePlayerIdx, 1);
    const currentPlayerIdx = proxyPlayers.findIndex(player => player.isMyTurnToMove);
    const nextProxyPlayerIdx = currentPlayerIdx + 1 >= proxyPlayers.length ? 0 : currentPlayerIdx + 1;

    const newMovingPlayerId = proxyPlayers[nextProxyPlayerIdx].id;
    const nextPlayerIdx = this.players.findIndex(player => player.id == newMovingPlayerId);
    if(nextPlayerIdx !== -1) {
      this.players[lastMovingPlayer].isMyTurnToMove = false;
      this.players[nextPlayerIdx].isMyTurnToMove = true;
    }
  }

  public updatePlayer = (player: PlayerEntity) => {
    
  }

  private _isPlayerAllowedToMove = (cardId: string) => {
    const playerIdx = this._findPlayerIdxByCardId(cardId);
    if(playerIdx == -1) return;
    const tableLength = this.table.flatMap(i => i).length;
    const firstTurn = this.players[playerIdx].isMyTurnToMove;
    const secondTurn = this.players[playerIdx].isMyTurnToCounterMove;
    return ((tableLength % 2 == 0) && (firstTurn && !secondTurn)) ||
      ((tableLength % 2 == 1) && (secondTurn && !firstTurn));
  }

  private _renderTrump = () => {
    const $trump = document.querySelector('#trump');
    if($trump && this.TRUMP) {
      $trump.innerHTML = 'Trump ' + SUITS_MAP.get(this.TRUMP);
    }
  }

  public init = () => {
    if(!this.UI) return;
    this._generateDeck();
    this.UI.generateDefaultPlayField(this.players);
    this._renderTrump();
    this._defineWhoMovesFirst();
    setTimeout(() => {
      console.log('players', this.players);
    }, 3000)

    document.addEventListener(EVENTS_ENUM.CLICK, (e: any) => {
      if(BoardEntity.IS_MOVEMENT_ALLOWED) {
        const target = e.detail;
        const isAllowed = this._isPlayerAllowedToMove(target.dataset.id);
        if(!isAllowed) return;
        this._removeCardFromPlayer(target.dataset.id);
        this.updatePlayersCardsForMoving();
      }
    });

    document.addEventListener(EVENTS_ENUM.SET_TABLE, (e: any) => {
      const cards: CardEntity[][] = e.detail;
      UIEntity.updateTable(cards);
      console.log(EVENTS_ENUM.SET_TABLE, cards);
    });

    document.querySelector('#check')?.addEventListener('click', () => {
      this.checkAction();
      console.log('players', this.players);
    });

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
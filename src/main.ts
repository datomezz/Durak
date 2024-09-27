import { CardEntity } from './entities/card.entity';
import { ALLOWED_MOVEMENT_COUNT, DECK_POWERS, SUITS, SUITS_MAP, SuitsEnum } from './index.constants';
import { PlayerEntity } from './entities/player.entity';
import { UIEntity } from './entities/ui.entity';
import { EventEntity, EVENTS_ENUM } from './entities/events.entity';
import { StateEntity } from './entities/state.entity';

import './style.css'

export interface IBoardEntityConstructor {
  totalPlayers: 2 | 3 | 4,
  debug?: boolean,
  debugSave?: boolean
};

export class BoardEntity {
  private _debug: boolean = false;
  private _debugSave: boolean = false;
  static MOVE_COUNT = StateEntity.MOVE_COUNT;

  get TRUMP() {
    return StateEntity.TRUMP;
  }

  set TRUMP(trump: SuitsEnum | null) {
    StateEntity.TRUMP = trump;
  }

  public UI: UIEntity | null = null
  public TOTAL_PLAYERS: number = StateEntity.TOTAL_PLAYERS;

  private _isPlayerTaking: boolean = false;
  private _playerCheckingCount: number = 0;
  private _IDS: number[] = [];

  constructor(args: IBoardEntityConstructor) {
    this.UI = new UIEntity();
    this._debug = args.debug ?? this._debug;
    this._debugSave = args.debugSave ?? this._debugSave;

    if(!this._debug) {
      this.TRUMP = SUITS[~~(Math.random() * SUITS.length)];
      this.TOTAL_PLAYERS = args.totalPlayers;
      StateEntity.TOTAL_PLAYERS = args.totalPlayers;

      this.players = Array.from({length: args.totalPlayers}, () => new PlayerEntity());
      // DEFINE HUMAN, HUMAN IS ALWAYS LAST INDEX
      this.players[this.players.length - 1].isHuman = true;
      this._IDS = this.players.map(p => p.id);
    }

    if(this._debug) {
      StateEntity.setToState();
      this.TRUMP = StateEntity.TRUMP;
      this.TOTAL_PLAYERS = StateEntity.TOTAL_PLAYERS;
      this.players = StateEntity.PLAYERS;
      this._recalculateIdxs();
    }
  }

  get allCards() {return StateEntity.ALL_CARDS };
  set allCards(cards: CardEntity[]) { 
    StateEntity.ALL_CARDS = cards;
  }

  get dumpCards() {return StateEntity.DUMP_CARDS };
  set dumpCards(cards: CardEntity[]) { 
    StateEntity.DUMP_CARDS = cards;
  }

  get table() {
    return StateEntity.TABLE;
  }

  set table(table: CardEntity[][]) {
    if(table.length <= ALLOWED_MOVEMENT_COUNT) {
      StateEntity.TABLE = table;
      EventEntity.dispatch(EVENTS_ENUM.SET_TABLE, table);

      if(table.flatMap(item => item).length === ALLOWED_MOVEMENT_COUNT * 2) {
        StateEntity.IS_MOVEMENT_ALLOWED = false;
      }
    }

    EventEntity.dispatch(EVENTS_ENUM.UPDATE_ALL_CARDS, this.allCards);
  }

  get players() {
    return StateEntity.PLAYERS;
  }

  set players(players: PlayerEntity[]) {
    StateEntity.PLAYERS = players;
  }
  
	private _firstMove: boolean = true;

  private _generateDeck = () => {
    const arr = [];
    // for(let x = 0; x < 3; x++) {
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

  private _cardsToTableCards = (removedCard: CardEntity[]): void => {
    if(this._isPlayerTaking) {
      const proxyTable = this.table;
      proxyTable.push(removedCard);
      this.table = proxyTable;
      return;
    }

    const result = [];
    let chunkSize = 2;
    let cards: CardEntity[] = [...this.table.flatMap(c => c), ...removedCard];
  
    for (let i = 0; i < cards.length; i += chunkSize) {
      const chunk = cards.slice(i, i + chunkSize);
      result.push(chunk);
    }
    
    this.table = result;
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

  private _findPlayerIdxByCardId = (cardId: string): number => {
    const card = this.players.flatMap(player => player.myCards).find(card => card.id == +cardId);
    if(!card) return -1;

    return this.players.findIndex(player => player.myCards.includes(card));
  }

  private _findPlayerIdxWhoMoves = () => {
    let idx = this.players.findIndex(player => player.isMyTurnToMove);
    if(idx === -1 && this.players.length <= 1) return idx;
    return idx === -1 ? 0 : idx;
  }

  private _findNextId = (id: number): number => {
    const existingIDs = this.players.map(p => p.id);
    let IDS = [...this._IDS];

    let nextId = null;
    while(nextId === null) {
      const idx = this._IDS.findIndex(n => n === id);
      const nextIdx = (idx + 1) % IDS.length;
      const target = existingIDs.find(i => i === IDS[nextIdx]);

      if(target) nextId = target;
      
      if(!target) {
        IDS = IDS.filter(i => i !== IDS[nextIdx]);
        if(!IDS.length) nextId = -1;
      }
    }

    return nextId;
  }

  private _findPlayerIdxWhoCounterMoves = (): number => {
    let idx = this.players.findIndex(player => player.isMyTurnToCounterMove);
    if(idx !== -1) return idx;
    if(idx === -1 && this.players.length <= 1) return idx;

    const nextId = this._findNextId(StateEntity.LAST_COUNTER_MOVE_PLAYER?.id as number);
    if(nextId === -1) return -1;

    return this.players.findIndex(p => p.id === nextId);
  }

  private _findNextIndex = (currentIdx: number) => {
    return (currentIdx + 1) % this.players.length;
  }

  public updatePlayersCardsForMoving = () => {
    this.players.forEach(p => p.modifyCardsForMoving(this.table));
  }

  public checkAction = async () => {
    if(this._isPlayerTaking) {
      const playersLength = this.players.length == 2 ? 1 : this.players.length - 2;

      if(this._playerCheckingCount === playersLength) {
        EventEntity.dispatch(EVENTS_ENUM.PLAYER_TOOK);
        this._isPlayerTaking = false;
        this._playerCheckingCount = 0;
        return;
      }

      const bots = this.players.filter(p => !p.isHuman);
      const bot = bots[this._findPlayerIdxWhoMoves()];

      if(!bot) {
        return EventEntity.dispatch(EVENTS_ENUM.BOARD_CHECK);
      }

      const cards = bot.myCards.filter(c => c.isAllowToMove);
      for(let i = 0; i < cards.length; i++) {
        bot.decideWhatToMove();
      }

      this._changeMovingPlayer();
      // this._playerCheckingCount++;
      return EventEntity.dispatch(EVENTS_ENUM.BOARD_CHECK);
    }

    this._changeMovingPlayer();
  }

  private _changeMovingPlayer = () => {
    const lastMovingPlayer = this._findPlayerIdxWhoMoves();
    const counterMovePlayerIdx = this._findPlayerIdxWhoCounterMoves();
    const proxyPlayers = [...this.players];
    proxyPlayers.splice(counterMovePlayerIdx, 1);
    const currentPlayerIdx = proxyPlayers.findIndex(player => player.isMyTurnToMove);
    const nextProxyPlayerIdx = (currentPlayerIdx + 1) % proxyPlayers.length;

    const newMovingPlayerId = proxyPlayers[nextProxyPlayerIdx].id;
    const nextPlayerIdx = this.players.findIndex(player => player.id == newMovingPlayerId);
    if(nextPlayerIdx !== -1) {
      this.players[lastMovingPlayer].isMyTurnToMove = false;
      this.players[nextPlayerIdx].isMyTurnToMove = true;
      // this.updatePlayersCardsForMoving();

      if(this._isPlayerTaking) this._playerCheckingCount++;
    }

  }

  public dumpAction = () => {
    this.dumpCards = [...this.dumpCards, ...this.table.flatMap(i => i)];
    this.table = [];
    UIEntity.updateTable(this.table);
    this._updateGame();
  }

  private _isPlayerAllowedToMove = (cardId: string): boolean => {
    const playerIdx = this._findPlayerIdxByCardId(cardId);

    if(playerIdx == -1) return false;
    const tableLength = this.table.flatMap(i => i).length;
    const firstTurn = this.players[playerIdx].isMyTurnToMove;
    const secondTurn = this.players[playerIdx].isMyTurnToCounterMove;
    if(this._isPlayerTaking) {
      const counterIdx = this._findPlayerIdxWhoCounterMoves();
      const filteredTable = this.table.filter(c => c.length === 1);

      if(secondTurn && this.players[playerIdx].myCards.find(c => c.id === +cardId)?.isAllowToMove) return true;
      if(this.players[counterIdx].myCards.length <= filteredTable.length) return false;
      if(this.table.length === ALLOWED_MOVEMENT_COUNT) return false;
      if(!this.players[this._findPlayerIdxWhoCounterMoves()].myCards.length) return false;
      if(secondTurn) return false;
      if(!firstTurn) return false;

      return true;
    }

    return ((tableLength % 2 == 0) && (firstTurn && !secondTurn)) ||
      ((tableLength % 2 == 1) && (secondTurn && !firstTurn));
  }

  private _renderTrump = () => {
    const $trump = document.querySelector('#trump');
    if($trump && this.TRUMP) {
      $trump.innerHTML = `<span class="${this.TRUMP}">${SUITS_MAP.get(this.TRUMP)}</span>`;
    }
  }

  private _updatePlayersCards = (): void => {
    // ADD ORDER SORTING, TO START COUNTING FROM PLAYER WHO MOVES FIRST
    let sortedArr = [...this.players.sort((a, b) => Number(b.isMyTurnToMove) - Number(a.isMyTurnToMove))];

    sortedArr.forEach(p => {
      const cards = p.myCards;
      for(let i = 0; i < 6 - cards.length; i++) {
        if(this.allCards.length) {
          const card = this.allCards.splice(0, 1);
          p.setCard(card[0]);
        }
      }

      if(!p.myCards.length) {
        p.hasFinished = true;

        if(p.isMyTurnToMove) {
          const idx = this.players.findIndex(player => p === player);
          const nextIdx = (idx + 1) % this.players.length;
          this.players.forEach(player => player.isMyTurnToCounterMove = false);
          this.players[nextIdx].isMyTurnToCounterMove = true;
        }
      }

      UIEntity.updatePlayer(p);
    });

    sortedArr = sortedArr.filter(i => !i.hasFinished);
    sortedArr.sort((a, b) => a.id - b.id);

    this.players = sortedArr;
  }

  private _recalculateIdxs = (counterIdx: number = this._findPlayerIdxWhoCounterMoves()) => {
    if(counterIdx === -1) return;
    if(this.players[counterIdx].hasTaken) {
      counterIdx = (counterIdx + 1) % this.players.length;
    }

    this.players.forEach(p => p.isMyTurnToMove = false);
    this.players[counterIdx].isMyTurnToMove = true;

    let nextCounterIdx = (counterIdx + 1) % this.players.length;
    if(nextCounterIdx === counterIdx) return;

    this.players.forEach(p => p.isMyTurnToCounterMove = false);
    this.players[nextCounterIdx].isMyTurnToCounterMove = true;
  }

  private _updateGame = () => {
    this._updatePlayersCards();
    EventEntity.dispatch(EVENTS_ENUM.UPDATE_ALL_CARDS, this.allCards);
    this._recalculateIdxs();
    this.updatePlayersCardsForMoving();

    if(this.players.length <= 1) {
      return this.finishGame();
    }

    EventEntity.dispatch(EVENTS_ENUM.GAME_UPDATED, null);
    StateEntity.IS_MOVEMENT_ALLOWED = !this.table.length;
  }

  public finishGame = () => {
    StateEntity.GAME_FINISHED = true;
    if(!this.players.length) {
      alert('Its Draw');
      return;
    }

    alert(`Player NO - ${this.players[0].id} Has Lost`);
  }

  public startGame = () => {
    const idx = this._findPlayerIdxWhoMoves();
    this.players[idx].decideWhatToMove();
  }

  public init = () => {
    if(!this.UI) return;

    if(!this._debug) {
      this._generateDeck();
      this.UI.generateDefaultPlayField(this.players);
      this._renderTrump();
      this._defineWhoMovesFirst();
      this.startGame();
    }

    if(this._debug) {
      this.UI.generateDefaultPlayFieldDebug(this.players, this.table);
      this._renderTrump();
      this.updatePlayersCardsForMoving();
      console.table(this.players);
    }

    // EVENT LISTENERS
    document.addEventListener(EVENTS_ENUM.UPDATE_ALL_CARDS, (e: any) => {
      const cards: CardEntity[] = e.detail;
      const $el = document.querySelector('#allCards');
      if($el) {
        $el.innerHTML = '' + cards.length;
      }
    });

    document.addEventListener(EVENTS_ENUM.CLICK, (e: any) => {
      if(StateEntity.IS_MOVEMENT_ALLOWED) {
        const target = e.detail;
        const playerIdx = this._findPlayerIdxByCardId(target.dataset.id);
        const isAllowed = this._isPlayerAllowedToMove(target.dataset.id);

        if(!isAllowed) return;
        if(!(target.dataset.isAllowToMove === 'true')) return;

        this.players[playerIdx].move(target);
        this.updatePlayersCardsForMoving();
      }
    });

    document.addEventListener(EVENTS_ENUM.SET_TABLE, (e: any) => {
      const cards: CardEntity[][] = e.detail;
      UIEntity.updateTable(cards);
      StateEntity.MOVE_COUNT++;
      if(this._debugSave) {
        StateEntity.save(3);
      }
    });

    document.addEventListener(EVENTS_ENUM.REMOVE_CARD_FROM_PLAYER, (e: any) => {
      const removedCard = e.detail;
      this._cardsToTableCards(removedCard);
    });

    document.addEventListener(EVENTS_ENUM.GAME_UPDATED, (e: any) => {
      this.players.forEach(p => p.hasTaken = false);
    });

    document.addEventListener(EVENTS_ENUM.PLAYER_TOOK, (e: any) => {
      const idx = this._findPlayerIdxWhoCounterMoves();
      this.players[idx].take(this.table);
      this.table = [];
      UIEntity.updateTable(this.table);
      this._updateGame();
    });

    document.addEventListener(EVENTS_ENUM.BOARD_CHECK, (e: any) => {
      this.checkAction();
    });

    document.addEventListener(EVENTS_ENUM.TEST, (e: any) => {
      if(StateEntity.GAME_FINISHED) return;
      const isHumanMoving = this.players[this._findPlayerIdxWhoMoves()].isHuman;
      const bots = this.players.filter(p => !p.isHuman)

      if(!this._isPlayerTaking) {
        this.table.flatMap(i => i).length % 2 === 0 ?
          bots[this._findPlayerIdxWhoMoves()]?.decideWhatToMove() :
          bots[this._findPlayerIdxWhoCounterMoves()]?.decideWhatToMove();
      }

      if(this._isPlayerTaking && !isHumanMoving) {
      }

    });

    document.addEventListener(EVENTS_ENUM.BOARD_TAKE, (e: any) => {
      this._isPlayerTaking = true;
    });

    // BUTTON LISTENERS
    document.querySelector('#check')?.addEventListener('click', () => {
      if(this._isPlayerTaking) {
        this._changeMovingPlayer();
      }
      this.checkAction();
      this.updatePlayersCardsForMoving();
    });

    document.querySelector('#move')?.addEventListener('click', () => {
    });


    document.querySelector('#dump')?.addEventListener('click', () => {
      this.dumpAction();
    });

    document.querySelector('#save')?.addEventListener('click', () => {
      StateEntity.setToLocalStorage();
    });

    document.querySelector('#take')?.addEventListener('click', () => {
      this._isPlayerTaking = true;
      this.checkAction();
      // EventEntity.dispatch(EVENTS_ENUM.BOARD_MOVE);
    });

  }

}

document.addEventListener('DOMContentLoaded', () => {
  const DEBUG = false;
  const TOTAL_PLAYERS = 3;
  DEBUG ? 
    new BoardEntity({ totalPlayers: TOTAL_PLAYERS, debug: true, debugSave: false }).init() 
    :
    new BoardEntity({ totalPlayers: TOTAL_PLAYERS, debug: false, debugSave: true }).init();
})

// WRITE RENDER FOR TABLE IN DEBUG MODE
// Write Autimatic Taking Logic.
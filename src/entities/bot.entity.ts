import { ALLOWED_MOVEMENT_COUNT } from "../index.constants";
import { CardEntity } from "./card.entity";
import { EventEntity, EVENTS_ENUM } from "./events.entity"
import { PlayerEntity } from "./player.entity";

export class BotEntity {

  constructor() { }

  private _p_first: PlayerEntity | null = null;
  private _p_second: PlayerEntity | null = null;
  private _table: CardEntity[][] = [];

  private _isCounterMove: boolean = false;
  private _isBotsTurn: boolean = false;
  private _isBotTaking: boolean = false;
  private _isBotCheking: boolean = false;

  public move = (selectedCard: CardEntity) => {
    const {id} = selectedCard;
    const $el = document.querySelector(`.card[data-id="${id}"]`) as HTMLElement;
    EventEntity.dispatch(EVENTS_ENUM.CLICK, $el);
    console.log('BOT MOVE');
  }

  public check = () => {
    EventEntity.dispatch(EVENTS_ENUM.BOARD_CHECK);
    console.log('BOT CHECK');
  }

  public take = () => {
    EventEntity.dispatch(EVENTS_ENUM.BOARD_TAKE);
    console.log('BOT TOOK');
  }

  private _setMoveAndCounterMovePlayers = (players: PlayerEntity[]) => {
    const p_first = players.find(p => p.isMyTurnToMove);
    const p_second = players.find(p => p.isMyTurnToCounterMove);
    this._p_first = p_first ?? null;
    this._p_second = p_second ?? null;
  }

  private _setTable = (table: CardEntity[][]) => {
    this._table = table;
    this._isCounterMove = table.flatMap(c => c).length % 2 === 1;

    if(this._p_second?.isTaking) {
      this._isCounterMove = false;
    }
  }

  private _checkIfHuman = () => {
    if(this._isCounterMove) {
      this._isBotsTurn = !this._p_second?.isHuman;
    } else {
      this._isBotsTurn = !this._p_first?.isHuman;
    }
  }

  private _findCardToMove = () => {
    const player = this._isCounterMove ? this._p_second : this._p_first;
    if(!player) return;

    const allowedCards = player.myCards.filter(c => c.isAllowToMove);

    const smallestOne = allowedCards
      .filter(c => !c.isTrump)
      .filter(c => c.isAllowToMove)
      .sort((a, b) => a.power - b.power)[0];

    const smallestTrumpOne = allowedCards
      .filter(c => c.isTrump)
      .filter(c => c.isAllowToMove)
      .sort((a, b) => a.power - b.power)[0];

    const selectedCard = smallestOne || smallestTrumpOne;
    return selectedCard;
  }

  public firstMove = (players: PlayerEntity[], table: CardEntity[][]) => {
    this._setMoveAndCounterMovePlayers(players);
    const selectedCard = this._findCardToMove();
    this._checkIfHuman();
    if(!this._isBotsTurn || !selectedCard) return;

    this.move(selectedCard);
  }

  private _count = 0;
  public define = (players: PlayerEntity[] = [], table: CardEntity[][] = []) => {
    console.log('DEFINE');
    setTimeout(() => {
      if(!players.length && !table.length) return;
      this._setMoveAndCounterMovePlayers(players);
      this._setTable(table);
      const selectedCard = this._findCardToMove();

      this._checkIfHuman();
      this._checkIfBotIsTaking();
      this._checkIfCheking();
      console.log('Counter', this._count++, table.flat().map(c => c.label));

      if(!this._isBotsTurn) {
        console.log('isHUman');
        return;
      };
      
      if(this._isBotTaking) {
        console.log('isBotTaking');
        this.take();
        this.check();
        this._isBotTaking = false;
        return;
      }

      if(this._isBotCheking) {
        console.log('isBotChecking');
        this.check();
        this._isBotCheking = false;
        return;
      }

      if(selectedCard) {
        if(this._table.length === ALLOWED_MOVEMENT_COUNT && this._table.flatMap(c => c).length % 2 === 0) {
          console.log('isBotCheckingButFull', selectedCard);
          // BOT HAS CARDS TO MOVE BUT TABLE IS FULL
          this.check();
          return;
        }

        return this.move(selectedCard);
      }

    }, 1000)
  }

  public resetTaking = () => {
    this._isBotTaking = false;
  }

  private _checkIfBotIsTaking = () => {
    if(!this._table.length) return;
    if(!this._p_second || !this._isCounterMove) return;
    console.log('COUNTER MOVE',!this._p_second, !this._isCounterMove);

    if(this._p_second.isTaking) {
      this._isBotTaking = false;
      return;
    }

    if(this._table.length === 0) {
      this._isBotTaking = false;
      return;
    }

    const allowedCards = this._p_second.myCards.filter(c => c.isAllowToMove);
    console.log('takingCards', allowedCards);
    // if(!allowedCards.length && !this._table.length) {
    if(!allowedCards.length) {
      this._isBotTaking = true;
    }
  }

  private _checkIfCheking = () => {
    if(!this._p_first || this._isCounterMove) return;
    const allowedCards = this._p_first.myCards.filter(c => c.isAllowToMove);
    this._isBotCheking = !allowedCards.length;
  }
}
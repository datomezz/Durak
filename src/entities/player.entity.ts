import { CardEntity } from "./card.entity";

export class PlayerEntity {
  static PLAYER_COUNT = 1;

  constructor() { 
    this.id = PlayerEntity.PLAYER_COUNT++;
  }

  public id = 0;
  public myCards: CardEntity[] = [];

  public setCards = (cards: CardEntity[]) => {
    this.myCards = cards;
  }

  private _isMyTurnToMove: boolean = false;
  private _isMyTurnToCounterMove: boolean = false;
  private _isHuman: boolean = false;

  get isHuman() { return this._isHuman; } 
  get isMyTurnToMove() { return this._isMyTurnToMove; } 
  get isMyTurnToCounterMove() { return this._isMyTurnToCounterMove; } 

  set isMyTurnToMove(bool: boolean) { this._isMyTurnToMove = bool; }
  set isMyTurnToCounterMove(bool: boolean) { this._isMyTurnToCounterMove = bool; }
  set isHuman(bool: boolean) { this._isHuman = bool}
  
  public modifyCardsForMoving = (tableCards: CardEntity[] = []) => {
    if(!tableCards.length) {
      this.myCards.forEach(card => card.isAllowToMove = true);
    }

    const powers = tableCards.map(card => card.power);
    const powerUniqueArr = Array.from(new Set(powers));

    this.myCards.forEach(card => {
      if(powerUniqueArr.includes(card.power)) {
        card.isAllowToMove = true;
      }
    });
  }

  public check = () => {};
  public move = (card: CardEntity) => {};
  public take = (cards: CardEntity[]) => {};
}

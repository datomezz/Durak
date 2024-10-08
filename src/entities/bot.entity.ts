import { CardEntity } from "./card.entity";
import { EventEntity, EVENTS_ENUM } from "./events.entity"
import { PlayerEntity } from "./player.entity";

export class BotEntity {
  static P_FIRST: PlayerEntity | null = null;
  static P_SECOND: PlayerEntity | null = null;
  static TABLE: CardEntity[][] = [];

  constructor() { }

  public move = () => {
    console.log('BOT MOVE');
  }

  public check = () => {
    EventEntity.dispatch(EVENTS_ENUM.BOARD_CHECK);
  }

  public take = () => {
    EventEntity.dispatch(EVENTS_ENUM.BOARD_TAKE);
  }

  private _count = 0;
  public define = (players: PlayerEntity[] = [], table: CardEntity[][] = []) => {
    if(!players.length) return;
    const p_first = players.find(p => p.isMyTurnToMove);
    const p_second = players.find(p => p.isMyTurnToCounterMove);
    const cardsLength = table.flatMap(i => i).length;

    if(!p_first || !p_second || (p_first.isHuman || p_second.isHuman)) return;
    if(p_first === BotEntity.P_FIRST && cardsLength % 2 === 1) {
      console.log('SAME FIRST');
      return;
    };

    if(p_second === BotEntity.P_SECOND && cardsLength % 2 === 0) {
      console.log('SAME SECOND');
      return;
    };

    BotEntity.P_FIRST = p_first;
    BotEntity.P_SECOND = p_second;
    console.log('Pizdec', ++this._count);

    // // console.log('table', p_first, p_second);

    // if(cardsLength % 2 === 1 && p_first.isMyTurnToMove) {
    //   this._move('Move', p_first);
    // }

    // if(cardsLength % 2 === 0 && p_second.isMyTurnToCounterMove) {
    //   this._move('Counter Move', p_second);
    // }
  }

  private _move = (...str: any) => {
    console.log(...str);
  }
}
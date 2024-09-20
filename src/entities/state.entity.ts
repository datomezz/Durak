import { SuitsEnum } from "../index.constants";
import { CardEntity } from "./card.entity";
import { PlayerEntity } from "./player.entity";

export class StateEntity {
  static MOVE_COUNT = 0;
  static IS_MOVEMENT_ALLOWED: boolean = true;
  static TRUMP: SuitsEnum | null = null;
  static PLAYERS: PlayerEntity[] = [];
  static ALL_CARDS: CardEntity[] = [];
  static DUMP_CARDS: CardEntity[] = [];
  static TABLE: CardEntity[][] = [];
  static TOTAL_PLAYERS: 2 | 3 | 4 = 2;
  static LAST_COUNTER_MOVE_PLAYER: PlayerEntity | null = null;

  static setToLocalStorage = () => {
    const obj = {};

    for(const [key, value] of Object.entries(StateEntity)) {
      Object.assign(obj, {[key]: value});
    }

    localStorage.setItem('state', JSON.stringify(obj));
  }

  static setToState = () => {
    const str = localStorage.getItem('state');
    if(!str) return;
    const obj = JSON.parse(str);

    for(let [key, value] of Object.entries(obj)) {
      switch(key) {
        case 'PLAYERS':
          value = (value as PlayerEntity[]).map(p => Object.assign(new PlayerEntity(), p));
          //@ts-ignore
          StateEntity[key] = value;
          break;
        default:
          //@ts-ignore
          StateEntity[key] = value;
      }
    }
  }

  static save = (count: number = 1) => {
    if(!(StateEntity.MOVE_COUNT % count)) {
      console.warn('debug saved', StateEntity.MOVE_COUNT, count, StateEntity.MOVE_COUNT % count);
      StateEntity.setToLocalStorage();
    }
  }
}

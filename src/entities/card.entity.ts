import { DECK_POWER_MAP, SUITS_MAP, SuitType } from "../index.constants";

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
  public label: string = '';

  constructor(args: ICardConstructor) {
    this.power = args.power;
    this.isTrump = args.isTrump;
    this.suit = args.suit;
    this.id = CardEntity.ID++;
    this.label = `${DECK_POWER_MAP.get(this.power)} ${SUITS_MAP.get(this.suit as any)}`;
  }

	public isAllowToMove: boolean = false;
}

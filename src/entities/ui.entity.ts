import { ElementEnum, SUITS_MAP } from "../index.constants";
import { EventEntity, EVENTS_ENUM } from "../main";
import { CardEntity } from "./card.entity";
import { PlayerEntity } from "./player.entity";

export class UIEntity {
  static $ROOT = document.querySelector<HTMLDivElement>('#app');

  static crateElement = (type: ElementEnum) => {
    const $el = document.createElement('div');

    switch(type) {
      case ElementEnum.GAME:
        $el.className = 'game';
        break;
      case ElementEnum.TABLE_CARDS:
        $el.className = 'table-cards';
        break;
      case ElementEnum.TRUMP:
        $el.className = 'trump';
        break;
      default:
        break;
    }

    return $el;
  }

  static createPlayer = (player: PlayerEntity) => {
    const $el = document.createElement('div');
    $el.dataset.id = `${player.id}`;
    $el.className = 'cards';

    player.isHuman ?
      $el.classList.add('player-original') : 
      $el.classList.add('player-dummy');

    return $el;
  }

  static createCard = (card: CardEntity | null = null) => {
    const $el = document.createElement('div');
    $el.className = 'card card-original';
    if(!card) return $el;
    
    for(let [key, value] of Object.entries(card)) {
      $el.dataset[key] = value;
      $el.innerHTML = `
        <span class="card__label">${card.label}</span>
        <span class="card__suit">${SUITS_MAP.get(card.suit as any)}</span>
        <span class="card__label">${card.label}</span>
      `;
      $el.classList.add(card.suit ?? '');
    }

    $el.addEventListener('click', (e: any) => {
      EventEntity.dispatch(EVENTS_ENUM.CLICK, e.currentTarget);
    })

    return $el;
  }

  constructor() { }

  public $players: HTMLDivElement[] = [];
  public $table: HTMLDivElement | null = null;

  public generateDefaultPlayField = (players: PlayerEntity[]) => {
    const $game = UIEntity.crateElement(ElementEnum.GAME);
    const $table_cards = UIEntity.crateElement(ElementEnum.TABLE_CARDS);
    const $player = UIEntity.createPlayer(players[players.length - 1]);

    const player_dummys = Array.from({length: players.length - 1}, (_, idx) => UIEntity.createPlayer(players[idx]));
    const human = players[players.length - 1];

    for(let i = 0; i < player_dummys.length; i++) {
      const $player_dummy = player_dummys[i];
      for(let x = 0; x < 6; x++) {
        $player_dummy.appendChild(UIEntity.createCard(players[i].myCards[x]));
      }

      $game.appendChild($player_dummy);
    }

    for(let i = 0; i < 6; i++) {
      $player.appendChild(UIEntity.createCard(human.myCards[i]));
      $table_cards.appendChild(UIEntity.createCard());
    }

    $game.appendChild($player);
    $game.appendChild($table_cards);

    this.$players = [...player_dummys, $player];
    this.$table = $table_cards;

    UIEntity.$ROOT?.appendChild($game);
  }

  public _generateCards = (cards: CardEntity[]): HTMLDivElement[] => {
    return cards.map(card => UIEntity.createCard(card));
  }

  public update = (players: PlayerEntity[], table: PlayerEntity | null = null) => {
    for(let i = 0; i < this.$players.length; i++) {
      const $cards = this._generateCards(players[i].myCards);
      this.removeElements(this.$players[i].children);
      $cards.forEach(el => this.$players[i].appendChild(el));
    }
  }

  public removeElement = ($el: HTMLDivElement) => {
    $el.remove();
  }

  public removeElements = (els: HTMLCollection) => {
    Array.from(els).forEach($el => $el.remove());
  }
}

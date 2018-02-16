import { Component } from '@angular/core';
import { FloatingActionButton } from 'ng2-floating-action-menu';

@Component({
  selector: 'app-action-menu',
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.css']
})
export class ActionMenuComponent {


  title = 'app';
  config;
  buttons: Array<FloatingActionButton> = [
  ];
 
  placements = [
    {
      value: 'br',
      key: 'bottom right'
    },
    {
      value: 'bl',
      key: 'bottom left'
    },
    {
      value: 'tr',
      key: 'top right'
    },
    {
      value: 'tl',
      key: 'top left'
    },
  ];
 
  effects = [
    {
      value: 'mfb-zoomin',
      key: 'Zoom In'
    },
    {
      value: 'mfb-slidein',
      key: 'Slide In + Fade'
    },
    {
      value: 'mfb-fountain',
      key: 'Fountain'
    },
    {
      value: 'mfb-slidein-spring',
      key: 'Slide In (Spring)'
    }
  ];
 
  toggles = [
    'click',
    'hover'
  ];
 
  constructor() {
    this.config = {
      placment: 'br',
      effect: 'mfb-zoomin',
      iconClass: 'fa fa-plus plus-button',
      activeIconClass: 'fa fa-plus plus-button',
      toggle: 'click',
      buttons: this.buttons
    };
  }
}

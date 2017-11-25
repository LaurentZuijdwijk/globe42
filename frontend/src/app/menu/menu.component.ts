import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { UserService } from '../user.service';
import { UserModel } from '../models/user.model';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'gl-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  // declare a slide animation trigger, which applies an animation on the height when the slide state
  // goes from collapsed to expanded, or vice-versa.
  animations: [
    trigger('slide', [
      state('collapsed', style({height: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', [
        animate('250ms ease-in')
      ])
    ])
  ]
})
export class MenuComponent implements OnInit, OnDestroy {

  /**
   * Indicates if the navbar must be collapsed. Only useful when the sandwich button is visible, i.e. when big is false.
   */
  navbarCollapsed = true;

  /**
   * Indicates if the navbar is big enough to not display the sandwich button, and to display all menu elements
   * on one horizontal row. This value changes thanks to a resize listener on the window. When it goes from false
   * to true, navbarCollapsed is reset to true so that it always appears collapsed initially.
   */
  private big: boolean;

  user: UserModel | null;
  userEventsSubscription: Subscription;

  constructor(private userService: UserService, private router: Router, private zone: NgZone) {
  }

  ngOnInit() {
    this.userEventsSubscription = this.userService.userEvents
      .subscribe(user => this.user = user);

    // compute the initial value of big.
    this.big = this.isBig();

    // add a listener on the window resize events, to recompute big. In order to avoid frequent detection changes
    // when the window is being resized, run this outside the angular zone, and only apply the actual changes
    // inside the zone.
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', () => {
        const newBig = this.isBig();
        if (newBig !== this.big) {
          this.zone.run(() => {
            this.big = newBig;
            if (newBig) {
              this.navbarCollapsed = true;
            }
          });
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.userEventsSubscription) {
      this.userEventsSubscription.unsubscribe();
    }
  }

  toggleNavbar() {
    this.navbarCollapsed = !this.navbarCollapsed;
  }

  logout(event) {
    event.preventDefault();
    this.userService.logout();
    this.router.navigate(['/']);
  }

  /**
   * Gets the state of the slide animation.
   * @returns 'none' if the navbar is big. Otherwise, 'collapsed' or 'expanded' depending on the navbarCollapsed value.
   */
  get slideState() {
    return this.big ? 'none' : (this.navbarCollapsed ? 'collapsed' : 'expanded');
  }

  private isBig() {
    const width = Math.max(window.document.documentElement.clientWidth, window.innerWidth || 0);
    return width >= 768;
  }
}

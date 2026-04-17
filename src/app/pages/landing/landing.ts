import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { FooterComponent } from '../../shared/footer/footer';
import { HeroComponent } from './sections/hero/hero';
import { FeaturesComponent } from './sections/features/features';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works';
import { StatsComponent } from './sections/stats/stats';

@Component({
  selector: 'app-landing',
  imports: [
    NavbarComponent,
    FooterComponent,
    HeroComponent,
    FeaturesComponent,
    HowItWorksComponent,
    StatsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar />
    <main>
      <app-hero />
      <app-features />
      <app-how-it-works />
      <app-stats />
    </main>
    <app-footer />
  `,
})
export class LandingPage {}

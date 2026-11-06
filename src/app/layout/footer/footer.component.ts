import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `<footer class="footer">Copyright DataShare® {{ year }}</footer>`,
  styles: `
    .footer {
      display: none;
      padding: 16px 40px;
      color: #fff;
      font-size: 0.75rem;
    }
    @media (min-width: 768px) {
      .footer { display: block; }
    }
  `,
})
export class FooterComponent {
  readonly year = 2026;
}

import type { Page } from '@playwright/test';
import { NavBar } from './components/nav-bar';
import { DashboardPage } from './dashboard-page';
import { ItemsPage } from './items-page';
import { LoginPage } from './login-page';

/** Every page object of the application, reached in a test as `app.<page>`. */
export class App {
  readonly nav: NavBar;
  readonly login: LoginPage;
  readonly dashboard: DashboardPage;
  readonly items: ItemsPage;

  constructor(page: Page) {
    this.nav = new NavBar(page);
    this.login = new LoginPage(page);
    this.dashboard = new DashboardPage(page);
    this.items = new ItemsPage(page);
  }
}

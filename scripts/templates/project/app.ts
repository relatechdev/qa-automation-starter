import type { Page } from '@playwright/test';
import { LoginPage } from './login-page';

/** Every page object of the application, reached in a test as `app.<page>`. */
export class App {
  readonly login: LoginPage;

  constructor(page: Page) {
    this.login = new LoginPage(page);
  }
}

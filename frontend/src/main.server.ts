import type { BootstrapContext } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, appConfig, context);
export default bootstrap;

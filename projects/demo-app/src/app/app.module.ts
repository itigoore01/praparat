import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { PraparatModule } from 'praparat';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    PraparatModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

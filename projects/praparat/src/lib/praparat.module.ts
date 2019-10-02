import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PraparatComponent } from './praparat.component';
import { DEFAULT_PRAPARAT_CONFIG, createPrapratConfig } from './praparat-config';



@NgModule({
  declarations: [PraparatComponent],
  imports: [
    CommonModule
  ],
  exports: [PraparatComponent],
  providers: [
    {
      provide: DEFAULT_PRAPARAT_CONFIG,
      useValue: createPrapratConfig(),
    }
  ],
})
export class PraparatModule { }

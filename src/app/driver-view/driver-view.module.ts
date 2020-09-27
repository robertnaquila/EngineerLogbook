import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DriverViewPageRoutingModule } from './driver-view-routing.module';

import { DriverViewPage } from './driver-view.page';
import { PipesModule } from '../pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    DriverViewPageRoutingModule
  ],
  declarations: [DriverViewPage]
})
export class DriverViewPageModule {}

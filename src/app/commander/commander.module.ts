import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CommanderPageRoutingModule } from './commander-routing.module';

import { CommanderPage } from './commander.page';
import { DriveViewModule } from '../drive-view/drive-view.module';
import { PipesModule } from '../pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommanderPageRoutingModule,
    DriveViewModule,
    PipesModule
  ],
  declarations: [CommanderPage]
})
export class CommanderPageModule {}
